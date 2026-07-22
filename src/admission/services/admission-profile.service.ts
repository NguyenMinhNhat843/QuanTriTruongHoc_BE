import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { ApplicationStatus, AdmissionType } from "../../../prisma/generated/prisma/client.js";
import {
  CreateAdmissionProfileDto,
  UpdateAdmissionProfileDto,
  SearchAdmissionProfileDto,
  ChangeProfileStatusDto,
} from "../dtos/admission-profile.dto.js";
import { StudentService } from "../../student/services/student.service.js";

@Injectable()
export class AdmissionProfileService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => StudentService))
    private readonly studentService: StudentService,
  ) {}

  private async generateApplicationCode(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `HS${year}-`;

    const lastProfile = await this.prisma.admissionProfile.findFirst({
      where: { applicationCode: { startsWith: prefix } },
      orderBy: { id: "desc" },
      select: { applicationCode: true },
    });

    if (!lastProfile) {
      return `${prefix}0001`;
    }

    const lastNumber = parseInt(lastProfile.applicationCode.replace(prefix, ""), 10);
    const nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;
    return `${prefix}${nextNumber.toString().padStart(4, "0")}`;
  }

  async create(dto: CreateAdmissionProfileDto) {
    const campaignMajor = await this.prisma.admissionCampaignMajor.findUnique({
      where: { id: dto.admissionCampaignMajorId },
      include: { admissionCampaign: true },
    });
    if (!campaignMajor) {
      throw new NotFoundException(
        `Cấu hình tuyển sinh (AdmissionCampaignMajor ID ${dto.admissionCampaignMajorId}) không tồn tại`,
      );
    }

    const existing = await this.prisma.admissionProfile.findUnique({
      where: {
        admissionCampaignMajorId_identityNumber: {
          admissionCampaignMajorId: dto.admissionCampaignMajorId,
          identityNumber: dto.identityNumber,
        },
      },
    });
    if (existing) {
      throw new BadRequestException(
        "Thí sinh với mã định danh/CCCD này đã nộp hồ sơ vào ngành trong đợt tuyển sinh này",
      );
    }

    // Auto calculate priority score if not provided
    let priorityBonus = dto.priorityScore || 0;
    if (!dto.priorityScore && (dto.priorityRegion || dto.priorityObject)) {
      const priorityRule = await this.prisma.priorityRule.findFirst({
        where: {
          academicYearId: campaignMajor.admissionCampaign.academicYearId,
          priorityRegion: dto.priorityRegion || null,
          priorityObject: dto.priorityObject || null,
        },
      });
      if (priorityRule) {
        priorityBonus = priorityRule.bonusScore;
      }
    }

    const applicationCode = await this.generateApplicationCode();
    const { examScores, transcriptSubjectScores, ...data } = dto;

    const profile = await this.prisma.$transaction(async (tx) => {
      const created = await tx.admissionProfile.create({
        data: {
          ...data,
          applicationCode,
          priorityScore: priorityBonus,
          status: ApplicationStatus.REGISTERED,
          examScores: examScores?.length
            ? {
                create: examScores.map((item) => ({
                  subjectCode: item.subjectCode,
                  score: item.score,
                })),
              }
            : undefined,
          transcriptSubjectScores: transcriptSubjectScores?.length
            ? {
                create: transcriptSubjectScores.map((item) => ({
                  gradeLevel: item.gradeLevel,
                  subjectCode: item.subjectCode,
                  score: item.score,
                })),
              }
            : undefined,
        },
      });

      await tx.admissionStatusLog.create({
        data: {
          admissionProfileId: created.id,
          fromStatus: null,
          toStatus: ApplicationStatus.REGISTERED,
          isSystem: true,
          reason: "Thí sinh đăng ký hồ sơ mới",
        },
      });

      return created;
    });

    await this.recalculateScore(profile.id);
    return this.findOne(profile.id);
  }

  async findAll(query: SearchAdmissionProfileDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.applicationCode) {
      where.applicationCode = { contains: query.applicationCode, mode: "insensitive" };
    }
    if (query.fullName) {
      where.fullName = { contains: query.fullName, mode: "insensitive" };
    }
    if (query.identityNumber) {
      where.identityNumber = { contains: query.identityNumber, mode: "insensitive" };
    }
    if (query.phone) {
      where.phone = { contains: query.phone, mode: "insensitive" };
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.admissionCampaignMajorId) {
      where.admissionCampaignMajorId = Number(query.admissionCampaignMajorId);
    }
    if (query.admissionCampaignId || query.majorId) {
      where.admissionCampaignMajor = {};
      if (query.admissionCampaignId) {
        where.admissionCampaignMajor.admissionCampaignId = Number(query.admissionCampaignId);
      }
      if (query.majorId) {
        where.admissionCampaignMajor.majorId = Number(query.majorId);
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.admissionProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          admissionCampaignMajor: {
            include: { admissionCampaign: true, major: true, subjectCombination: true },
          },
          province: true,
          ward: true,
          village: true,
        },
      }),
      this.prisma.admissionProfile.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: number) {
    const profile = await this.prisma.admissionProfile.findUnique({
      where: { id },
      include: {
        admissionCampaignMajor: {
          include: { admissionCampaign: true, major: true, subjectCombination: true },
        },
        subjectCombination: { include: { items: true } },
        examScores: true,
        transcriptSubjectScores: true,
        documents: {
          where: { isLatest: true },
          include: { documentConfigItem: true },
        },
        statusLogs: {
          orderBy: { createdAt: "desc" },
          include: { byUser: { select: { id: true, username: true } } },
        },
        province: true,
        ward: true,
        village: true,
        student: true,
      },
    });

    if (!profile) {
      throw new NotFoundException(`Hồ sơ đăng ký xét tuyển ID ${id} không tồn tại`);
    }

    return profile;
  }

  async update(id: number, dto: UpdateAdmissionProfileDto) {
    await this.findOne(id);

    const { examScores, transcriptSubjectScores, ...data } = dto;

    await this.prisma.$transaction(async (tx) => {
      if (examScores) {
        await tx.examScore.deleteMany({ where: { admissionProfileId: id } });
        await tx.examScore.createMany({
          data: examScores.map((item) => ({
            admissionProfileId: id,
            subjectCode: item.subjectCode,
            score: item.score,
          })),
        });
      }

      if (transcriptSubjectScores) {
        await tx.transcriptSubjectScore.deleteMany({ where: { admissionProfileId: id } });
        await tx.transcriptSubjectScore.createMany({
          data: transcriptSubjectScores.map((item) => ({
            admissionProfileId: id,
            gradeLevel: item.gradeLevel,
            subjectCode: item.subjectCode,
            score: item.score,
          })),
        });
      }

      await tx.admissionProfile.update({
        where: { id },
        data,
      });
    });

    await this.recalculateScore(id);
    return this.findOne(id);
  }

  async changeStatus(id: number, dto: ChangeProfileStatusDto, byUserId?: number) {
    const profile = await this.findOne(id);
    const oldStatus = profile.status;
    const newStatus = dto.status;

    if (oldStatus === newStatus) {
      return profile;
    }

    const updatedProfile = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.admissionProfile.update({
        where: { id },
        data: { status: newStatus },
      });

      await tx.admissionStatusLog.create({
        data: {
          admissionProfileId: id,
          fromStatus: oldStatus,
          toStatus: newStatus,
          byUserId: byUserId || null,
          isSystem: !byUserId,
          reason: dto.reason || `Chuyển trạng thái sang ${newStatus}`,
        },
      });

      return updated;
    });

    // Workflow check: When status becomes ENROLLED, create Student & User account!
    if (newStatus === ApplicationStatus.ENROLLED && !profile.studentId) {
      const student = await this.studentService.createStudentFromAdmissionProfile(id);
      await this.prisma.admissionProfile.update({
        where: { id },
        data: { studentId: student.id },
      });
    }

    return this.findOne(id);
  }

  async recalculateScore(id: number) {
    const profile = await this.prisma.admissionProfile.findUnique({
      where: { id },
      include: {
        examScores: true,
        transcriptSubjectScores: true,
      },
    });
    if (!profile) return;

    let rawTotalScore = 0;

    if (profile.isDirectAdmission) {
      rawTotalScore = 10;
    } else if (profile.admissionType === AdmissionType.EXAM_SCORE) {
      rawTotalScore = profile.examScores.reduce((sum, item) => sum + item.score, 0);
    } else if (profile.admissionType === AdmissionType.ACADEMIC_TRANSCRIPT_SUBJECT) {
      rawTotalScore = profile.transcriptSubjectScores.reduce((sum, item) => sum + item.score, 0);
    } else if (profile.admissionType === AdmissionType.ACADEMIC_TRANSCRIPT_GPA) {
      // Average GPA from reported years
      const gpas = [profile.gpa9, profile.gpa8, profile.gpa7, profile.gpa6, profile.gpa12, profile.gpa11, profile.gpa10].filter(
        (val): val is number => val !== null && val !== undefined,
      );
      if (gpas.length > 0) {
        rawTotalScore = gpas.reduce((sum, val) => sum + val, 0) / gpas.length;
      }
    }

    const priority = profile.priorityScore || 0;
    const finalScore = Number((rawTotalScore + priority).toFixed(2));

    await this.prisma.admissionProfile.update({
      where: { id },
      data: {
        totalExamScore: rawTotalScore,
        scoreCalculated: finalScore,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.admissionProfile.delete({
      where: { id },
    });
  }
}

