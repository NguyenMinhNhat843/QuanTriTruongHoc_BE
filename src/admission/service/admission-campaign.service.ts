import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  CreateAdmissionCampaignDto,
  UpdateAdmissionCampaignDto,
  SearchAdmissionCampaignDto,
} from "../dto/admission-campaign.dto"; // Adjust path to your DTO
import { PrismaService } from "../../prisma/prisma.service";
import { ApplicationStatus, CampaignStatus } from "../../../prisma/generated/prisma/enums";

@Injectable()
export class AdmissionCampaignService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo mới AdmissionCampaign kèm danh sách Majors (dùng Transaction)
   */
  async create(dto: CreateAdmissionCampaignDto) {
    const { items, ...campaignData } = dto;

    return this.prisma.admissionCampaign.create({
      data: {
        ...campaignData,
        campaignMajors: items?.length
          ? {
              create: items.map((item) => ({
                majorId: item.majorId,
                quota: item.quota,
                benchmarkScore: item.benchmarkScore,
              })),
            }
          : undefined,
      },
      include: {
        campaignMajors: true,
      },
    });
  }

  /**
   * Tự động xét duyệt kết quả trúng tuyển cho 1 Đợt tuyển sinh
   */
  async approveCampaign(campaignId: number, executorUserId: number) {
    // 1. Kiểm tra Đợt tuyển sinh có tồn tại
    const campaign = await this.prisma.admissionCampaign.findUnique({
      where: { id: campaignId },
      include: {
        campaignMajors: true, // Lấy chỉ tiêu + điểm chuẩn từng ngành
      },
    });

    if (!campaign) {
      throw new NotFoundException("Không tìm thấy đợt tuyển sinh");
    }

    if (campaign.status === CampaignStatus.COMPLETED) {
      throw new BadRequestException("Đợt tuyển sinh này đã hoàn tất xét duyệt trước đó");
    }

    const reportResults: {
      majorId: number;
      quota: number;
      totalSubmitted: number;
      approvedCount: number;
      rejectedCount: number;
    }[] = [];

    // 2. Chạy Transaction xử lý xét duyệt theo từng ngành
    await this.prisma.$transaction(async (tx) => {
      for (const campaignMajor of campaign.campaignMajors) {
        const { majorId, quota, benchmarkScore } = campaignMajor;

        // Lấy tất cả hồ sơ hợp lệ đang chờ xét duyệt (SUBMITTED) của ngành này
        const eligibleProfiles = await tx.admissionProfile.findMany({
          where: {
            admissionCampaignId: campaignId,
            majorId: majorId,
            status: ApplicationStatus.SUBMITTED,
          },
          orderBy: [
            { isDirectAdmission: "desc" }, // Ưu tiên 1: Tuyển thẳng
            { scoreCalculated: "desc" }, // Ưu tiên 2: Điểm xét tuyển giảm dần
          ],
        });

        const approvedIds: number[] = [];
        const rejectedIds: number[] = [];

        eligibleProfiles.forEach((profile, index) => {
          // Điều kiện đậu:
          // 1. Thuộc diện tuyển thẳng HOẶC
          // 2. Điểm >= benchmarkScore (nếu có quy định điểm chuẩn) HOẶC
          // 3. Xếp hạng trong phạm vi chỉ tiêu (quota)
          const isPassedScore = benchmarkScore ? (profile.scoreCalculated ?? 0) >= benchmarkScore : true;

          if (profile.isDirectAdmission || (index < quota && isPassedScore)) {
            approvedIds.push(profile.id);
          } else {
            rejectedIds.push(profile.id);
          }
        });

        // 3. Cập nhật trạng thái APPROVED (Trúng tuyển)
        if (approvedIds.length > 0) {
          await tx.admissionProfile.updateMany({
            where: { id: { in: approvedIds } },
            data: { status: ApplicationStatus.APPROVED },
          });

          // Tạo log duyệt
          await tx.admissionStatusLog.createMany({
            data: approvedIds.map((id) => ({
              admissionProfileId: id,
              fromStatus: ApplicationStatus.SUBMITTED,
              toStatus: ApplicationStatus.APPROVED,
              byUserId: executorUserId,
              reason: "Hệ thống tự động duyệt trúng tuyển theo chỉ tiêu đợt",
            })),
          });
        }

        // 4. Cập nhật trạng thái REJECTED (Không trúng tuyển)
        if (rejectedIds.length > 0) {
          await tx.admissionProfile.updateMany({
            where: { id: { in: rejectedIds } },
            data: { status: ApplicationStatus.REJECTED },
          });

          await tx.admissionStatusLog.createMany({
            data: rejectedIds.map((id) => ({
              admissionProfileId: id,
              fromStatus: ApplicationStatus.SUBMITTED,
              toStatus: ApplicationStatus.REJECTED,
              byUserId: executorUserId,
              reason: "Không trúng tuyển (Vượt quá chỉ tiêu hoặc không đủ điểm chuẩn)",
            })),
          });
        }

        reportResults.push({
          majorId,
          quota,
          totalSubmitted: eligibleProfiles.length,
          approvedCount: approvedIds.length,
          rejectedCount: rejectedIds.length,
        });
      }

      // 5. Cập nhật trạng thái Đợt tuyển sinh sang COMPLETED
      await tx.admissionCampaign.update({
        where: { id: campaignId },
        data: { status: CampaignStatus.COMPLETED },
      });
    });

    return {
      message: "Xét duyệt đợt tuyển sinh hoàn tất thành công",
      campaignId,
      summary: reportResults,
    };
  }

  /**
   * Lấy danh sách đợt tuyển sinh có phân trang & hỗ trợ lọc theo name, status
   */
  async findAll(query: SearchAdmissionCampaignDto & { page?: number; limit?: number }) {
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

    const [data, total] = await Promise.all([
      this.prisma.admissionCampaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          campaignMajors: {
            include: {
              major: true,
            },
          },
        },
      }),
      this.prisma.admissionCampaign.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  /**
   * Lấy chi tiết 1 AdmissionCampaign theo ID
   */
  async findOne(id: number) {
    const campaign = await this.prisma.admissionCampaign.findUnique({
      where: { id },
      include: {
        campaignMajors: {
          include: {
            major: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException(`AdmissionCampaign with ID ${id} not found`);
    }

    return campaign;
  }

  /**
   * Cập nhật AdmissionCampaign và làm mới danh sách Majors
   */
  async update(id: number, dto: UpdateAdmissionCampaignDto) {
    await this.findOne(id); // Kiểm tra tồn tại

    const { items, ...campaignData } = dto;

    return this.prisma.$transaction(async (tx) => {
      // Nếu client truyền lại danh sách items, làm sạch items cũ trước khi thêm mới
      if (items) {
        await tx.admissionCampaignMajor.deleteMany({
          where: { admissionCampaignId: id },
        });
      }

      return tx.admissionCampaign.update({
        where: { id },
        data: {
          ...campaignData,
          campaignMajors: items
            ? {
                create: items.map((item) => ({
                  majorId: item.majorId,
                  quota: item.quota,
                  benchmarkScore: item.benchmarkScore,
                })),
              }
            : undefined,
        },
        include: {
          campaignMajors: true,
        },
      });
    });
  }

  /**
   * Xóa AdmissionCampaign (Cascade sẽ tự động xóa các admissionCampaignMajors liên quan)
   */
  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.admissionCampaign.delete({
      where: { id },
    });
  }
}
