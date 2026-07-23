import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
  Logger,
  InternalServerErrorException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { ApplicationStatus } from "../../../prisma/generated/prisma/client.js";
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
    // 1. Kiểm tra AdmissionCampaignMajor có tồn tại hay không
    const campaignMajor = await this.prisma.admissionCampaignMajor.findUnique({
      where: { id: dto.admissionCampaignMajorId },
      include: { admissionCampaign: true },
    });
    if (!campaignMajor) {
      throw new NotFoundException(
        `Cấu hình tuyển sinh (AdmissionCampaignMajor ID ${dto.admissionCampaignMajorId}) không tồn tại`,
      );
    }

    // 2. Kiểm tra trùng lặp hồ sơ (1 CCCD chỉ đăng ký 1 lần / ngành / đợt)
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

    // 3. Tạo mã hồ sơ & Tách mảng điểm học bạ ra khỏi DTO
    const applicationCode = await this.generateApplicationCode();
    const { transcriptSubjectScores, ...profileData } = dto;

    const totalScore =
      transcriptSubjectScores?.reduce((sum, item) => sum + item.score, 0) / (transcriptSubjectScores?.length / 3) || 0;
    console.log("Total Score:", totalScore);

    try {
      const profile = await this.prisma.$transaction(async (tx) => {
        // Step A: Tạo Hồ sơ tuyển sinh (AdmissionProfile)
        const createdProfile = await tx.admissionProfile.create({
          data: {
            ...profileData,
            avgSubjectScore: totalScore,
            applicationCode,
            status: ApplicationStatus.REGISTERED,
          },
        });

        // Step B: Tạo danh sách Điểm học bạ (TranscriptSubjectScores) nếu có
        if (transcriptSubjectScores && transcriptSubjectScores.length > 0) {
          const scoresToCreate = transcriptSubjectScores.map((item) => ({
            admissionProfileId: createdProfile.id,
            gradeLevel: item.gradeLevel,
            subjectCode: item.subjectCode,
            score: item.score,
          }));

          await tx.transcriptSubjectScore.createMany({
            data: scoresToCreate,
          });
        }

        // Step C: Ghi Log trạng thái ban đầu
        await tx.admissionStatusLog.create({
          data: {
            admissionProfileId: createdProfile.id,
            fromStatus: null,
            toStatus: ApplicationStatus.REGISTERED,
            isSystem: true,
            reason: "Thí sinh đăng ký hồ sơ mới",
          },
        });

        return createdProfile;
      });

      // 4. Tính toán lại điểm trung bình cache (avgSubjectScore)
      await this.recalculateScore(profile.id);

      // 5. Trả về thông tin chi tiết hồ sơ vừa tạo
      return this.findOne(profile.id);
    } catch (error) {
      Logger.error("Error creating admission profile:", error);
      throw new InternalServerErrorException("Có lỗi xảy ra khi tạo hồ sơ tuyển sinh.");
    }
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

    return { data, total };
  }

  async findOne(id: number) {
    const profile = await this.prisma.admissionProfile.findUnique({
      where: { id },
      include: {
        admissionCampaignMajor: {
          include: {
            major: true,
            subjectCombination: {
              include: { items: true },
            },
            admissionCampaign: true,
          },
        },
        // Địa giới hành chính
        province: true,
        ward: true,
        village: true,
        // Điểm học bạ
        transcriptSubjectScores: true,
        // Giấy tờ đính kèm (chỉ lấy bản mới nhất)
        documents: {
          where: { isLatest: true },
          include: { documentConfigItem: true },
        },
        // Lịch sử chuyển trạng thái
        statusLogs: {
          orderBy: { createdAt: "desc" },
          include: {
            byUser: {
              select: { id: true, username: true },
            },
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException(`Hồ sơ đăng ký xét tuyển ID ${id} không tồn tại`);
    }

    const { admissionCampaignMajor, ...profileData } = profile;

    return {
      profile: profileData,
      admissionCampaignMajor,
      transcriptSubjectScores: profile.transcriptSubjectScores,
      documents: profile.documents,
      statusLogs: profile.statusLogs,
    };
  }

  async update(id: number, dto: UpdateAdmissionProfileDto) {
    await this.findOne(id);

    const { transcriptSubjectScores, ...data } = dto;

    await this.prisma.$transaction(async (tx) => {
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
    const oldStatus = profile.profile.status;
    const newStatus = dto.status;

    if (oldStatus === newStatus) {
      return profile;
    }

    await this.prisma.$transaction(async (tx) => {
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
    if (newStatus === ApplicationStatus.ENROLLED && !profile.profile.studentId) {
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
        transcriptSubjectScores: true,
      },
    });

    if (!profile) return;

    const scores = profile.transcriptSubjectScores;

    let avgSubjectScore: number | null = null;

    if (scores && scores.length > 0) {
      const totalScore = scores.reduce((sum, item) => sum + item.score, 0);
      const rawAvg = totalScore / (scores.length / 3);
      avgSubjectScore = Number(rawAvg.toFixed(2));
    }

    await this.prisma.admissionProfile.update({
      where: { id },
      data: {
        avgSubjectScore,
      },
    });
  }

  async remove(id: number) {
    try {
      return await this.prisma.admissionProfile.delete({
        where: { id },
      });
    } catch (error) {
      Logger.error(`Error deleting admission profile ID ${id}:`, error);
      throw new InternalServerErrorException("Có lỗi xảy ra khi xóa hồ sơ tuyển sinh.");
    }
  }
}
