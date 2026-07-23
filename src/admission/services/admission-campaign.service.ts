import { Injectable, NotFoundException, InternalServerErrorException, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import {
  AcademicYearStatus,
  ApplicationStatus,
  CampaignStatus,
  Prisma,
} from "../../../prisma/generated/prisma/client.js";
import {
  CreateAdmissionCampaignDto,
  UpdateAdmissionCampaignDto,
  SearchAdmissionCampaignDto,
  FindActiveCampaignDto,
} from "../dtos/admission-campaign.dto.js";

@Injectable()
export class AdmissionCampaignService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateAdmissionCampaignDto) {
    const { campaignMajors, ...campaignData } = createDto;

    try {
      // Bọc toàn bộ vào 1 Transaction
      return await this.prisma.$transaction(async (tx) => {
        // 1. Tạo AdmissionCampaign trước
        const campaign = await tx.admissionCampaign.create({
          data: campaignData,
        });

        // 2. Tạo danh sách CampaignMajors sau (nếu có)
        if (campaignMajors && campaignMajors.length > 0) {
          const majorsToCreate = campaignMajors.map((major) => ({
            ...major,
            admissionCampaignId: campaign.id,
            subjectCombinationId: major.subjectCombinationId,
            minScorePerSubject: major.minScorePerSubject ?? null,
            minTotalScore: major.minTotalScore ?? null,
            minConduct: major.minConduct ?? null,
            cutoffScore: major.cutoffScore ?? null,
          }));

          await tx.admissionCampaignMajor.createMany({
            data: majorsToCreate,
          });
        }

        // 3. Trả về campaign kèm theo danh sách majors vừa tạo
        return tx.admissionCampaign.findUnique({
          where: { id: campaign.id },
          include: {
            campaignMajors: true,
          },
        });
      });
    } catch (error) {
      Logger.error("Error creating admission campaign:", error);
      throw new InternalServerErrorException("Có lỗi xảy ra khi tạo đợt tuyển sinh.");
    }
  }

  async approveAdmissionCampaign(id: number) {
    // 1. Kiểm tra Đợt tuyển sinh có tồn tại không
    const campaign = await this.prisma.admissionCampaign.findUnique({
      where: { id },
      include: {
        campaignMajors: true,
      },
    });

    if (!campaign) {
      throw new NotFoundException(`Đợt tuyển sinh ID ${id} không tồn tại.`);
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const approvedProfileIds: number[] = [];
        const rejectedProfileIds: number[] = [];

        // 2. Xét duyệt theo từng Ngành (AdmissionCampaignMajor) trong Đợt
        for (const campaignMajor of campaign.campaignMajors) {
          const { id: campaignMajorId, quota, minTotalScore = 0, minScorePerSubject = 1.0 } = campaignMajor;

          // Lấy tất cả hồ sơ đang REGISTERED của Ngành này
          const profiles = await tx.admissionProfile.findMany({
            where: {
              admissionCampaignMajorId: campaignMajorId,
              status: ApplicationStatus.REGISTERED,
            },
            include: {
              transcriptSubjectScores: true, // Lấy danh sách điểm học bạ các môn
            },
          });

          if (!profiles.length) continue;

          // 3. Lọc các hồ sơ ĐỦ ĐIỀU KIỆN ĐIỂM (Điểm sàn & Điểm chống liệt)
          const eligibleProfiles = profiles.filter((profile) => {
            // Check 1: Điểm trung bình xét tuyển >= Điểm sàn ngành
            if ((profile.avgSubjectScore ?? 0) < (minTotalScore || 0)) {
              return false;
            }

            // Check 2: Điểm trung bình từng môn >= Điểm liệt
            // Nhóm điểm theo môn (subjectCode) để tính điểm trung bình môn đó qua các năm/kỳ
            const subjectScoreMap = new Map<string, { total: number; count: number }>();

            for (const item of profile.transcriptSubjectScores) {
              const current = subjectScoreMap.get(item.subjectCode) || { total: 0, count: 0 };
              subjectScoreMap.set(item.subjectCode, {
                total: current.total + item.score,
                count: current.count + 1,
              });
            }

            // Kiểm tra xem có môn nào bị dính điểm liệt không
            for (const [, data] of subjectScoreMap.entries()) {
              const avgSubject = data.total / data.count;
              if (avgSubject < (minScorePerSubject || 0)) {
                return false; // Bị liệt môn này
              }
            }

            return true;
          });

          // Các hồ sơ không đạt điều kiện điểm -> Đưa vào danh sách loại (Rejected)
          const ineligibleProfileIds = profiles
            .filter((p) => !eligibleProfiles.some((ep) => ep.id === p.id))
            .map((p) => p.id);
          rejectedProfileIds.push(...ineligibleProfileIds);

          // 4. Sắp xếp danh sách đạt điều kiện theo thứ tự ưu tiên:
          // Điểm cao hơn > Hạnh kiểm tốt hơn > Thời gian nộp sớm hơn
          eligibleProfiles.sort((a, b) => {
            // Ưu tiên 1: avgSubjectScore (Giảm dần)
            if ((b.avgSubjectScore ?? 0) !== (a.avgSubjectScore ?? 0)) {
              return (b.avgSubjectScore ?? 0) - (a.avgSubjectScore ?? 0);
            }

            // Ưu tiên 3: Thời gian đăng ký (Tăng dần - Nộp trước ưu tiên trước)
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          });

          // 5. Cắt danh sách theo Chỉ tiêu (Quota)
          const passedProfiles = eligibleProfiles.slice(0, quota);
          const failedProfiles = eligibleProfiles.slice(quota);

          approvedProfileIds.push(...passedProfiles.map((p) => p.id));
          rejectedProfileIds.push(...failedProfiles.map((p) => p.id));
        }

        // 6. Cập nhật Database & Ghi Log Trạng Thái

        // A. Cập nhật Hồ sơ ĐẬU (APPROVED)
        if (approvedProfileIds.length > 0) {
          await tx.admissionProfile.updateMany({
            where: { id: { in: approvedProfileIds } },
            data: { status: ApplicationStatus.APPROVED },
          });

          await tx.admissionStatusLog.createMany({
            data: approvedProfileIds.map((id) => ({
              admissionProfileId: id,
              fromStatus: ApplicationStatus.REGISTERED,
              toStatus: ApplicationStatus.APPROVED,
              isSystem: true,
              reason: "Tự động duyệt: Đạt điểm sàn và nằm trong chỉ tiêu xét tuyển",
            })),
          });
        }

        // B. Cập nhật Hồ sơ RỚT / KHÔNG ĐẠT (REJECTED)
        if (rejectedProfileIds.length > 0) {
          await tx.admissionProfile.updateMany({
            where: { id: { in: rejectedProfileIds } },
            data: { status: ApplicationStatus.REJECTED },
          });

          await tx.admissionStatusLog.createMany({
            data: rejectedProfileIds.map((id) => ({
              admissionProfileId: id,
              fromStatus: ApplicationStatus.REGISTERED,
              toStatus: ApplicationStatus.REJECTED,
              isSystem: true,
              reason: "Tự động từ chối: Không đạt điểm sàn/điểm liệt hoặc vượt quá chỉ tiêu",
            })),
          });
        }

        return {
          message: "Xét duyệt đợt tuyển sinh thành công",
          totalApproved: approvedProfileIds.length,
          totalRejected: rejectedProfileIds.length,
        };
      });
    } catch (error) {
      throw new InternalServerErrorException(`Lỗi trong quá trình xét duyệt đợt tuyển sinh: ${error}`);
    }
  }

  async findAll(query: SearchAdmissionCampaignDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.name) {
      where.name = { contains: query.name, mode: "insensitive" };
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.academicYearId) {
      where.academicYearId = Number(query.academicYearId);
    }

    const [data, total] = await Promise.all([
      this.prisma.admissionCampaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          academicYear: {
            select: { id: true, code: true, status: true, isCurrent: true },
          },
        },
      }),
      this.prisma.admissionCampaign.count({ where }),
    ]);

    return { data, total };
  }

  async findActiveCampaigns(query?: FindActiveCampaignDto) {
    const { majorId, trainingType } = query || {};

    // 1. Điều kiện chung: Năm học ACTIVE và Đợt tuyển sinh đang mở (OPEN)
    const whereCondition: Prisma.AdmissionCampaignWhereInput = {
      status: CampaignStatus.OPEN, // Lọc các đợt đang nhận hồ sơ
      academicYear: {
        status: AcademicYearStatus.ACTIVE,
      },
    };

    // 2. Nếu truyền majorId hoặc trainingType -> Lọc thông qua bảng trung gian campaignMajors (some)
    if (majorId || trainingType) {
      whereCondition.campaignMajors = {
        some: {
          ...(majorId && { majorId: Number(majorId) }),
          ...(trainingType && { trainingType }),
        },
      };
    }

    return this.prisma.admissionCampaign.findMany({
      where: whereCondition,
      orderBy: { startDate: "asc" },
      include: {
        academicYear: {
          select: { id: true, code: true, status: true, isCurrent: true },
        },
        // Trả về luôn thông tin Ngành & Hệ mở trong đợt này (có filter theo query nếu có)
        campaignMajors: {
          where: {
            ...(majorId && { majorId: Number(majorId) }),
            ...(trainingType && { trainingType }),
          },
          include: {
            major: {
              select: { id: true, majorCode: true, majorName: true },
            },
            subjectCombination: {
              include: {
                items: true,
              },
            },
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const campaign = await this.prisma.admissionCampaign.findUnique({
      where: { id },
      include: {
        academicYear: true,
        campaignMajors: {
          include: { major: true, subjectCombination: true },
        },
      },
    });
    if (!campaign) {
      throw new NotFoundException(`Đợt tuyển sinh ID ${id} không tồn tại`);
    }
    return campaign;
  }

  async update(id: number, dto: UpdateAdmissionCampaignDto) {
    await this.findOne(id);
    const { campaignMajors, ...data } = dto;

    if (campaignMajors) {
      return this.prisma.$transaction(async (tx) => {
        await tx.admissionCampaignMajor.deleteMany({
          where: { admissionCampaignId: id },
        });
        return tx.admissionCampaign.update({
          where: { id },
          data: {
            ...data,
            campaignMajors: {
              create: campaignMajors.map((item) => ({
                majorId: item.majorId,
                batchId: item.batchId,
                trainingType: item.trainingType,
                quota: item.quota,
                subjectCombinationId: item.subjectCombinationId,
                minScorePerSubject: item.minScorePerSubject,
                minTotalScore: item.minTotalScore,
                minConduct: item.minConduct,
                cutoffScore: item.cutoffScore,
              })),
            },
          },
          include: {
            academicYear: true,
            campaignMajors: { include: { major: true, subjectCombination: true } },
          },
        });
      });
    }

    return this.prisma.admissionCampaign.update({
      where: { id },
      data,
      include: {
        academicYear: true,
        campaignMajors: { include: { major: true, subjectCombination: true } },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.admissionCampaign.delete({
      where: { id },
    });
  }
}
