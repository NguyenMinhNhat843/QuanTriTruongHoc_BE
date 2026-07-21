import { Injectable, NotFoundException } from "@nestjs/common";
import {
  CreateAdmissionCampaignDto,
  UpdateAdmissionCampaignDto,
  SearchAdmissionCampaignDto,
} from "../dto/admission-campaign.dto"; // Adjust path to your DTO
import { PrismaService } from "../../prisma/prisma.service";

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
