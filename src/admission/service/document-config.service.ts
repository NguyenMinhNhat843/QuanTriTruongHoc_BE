import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateDocumentConfigDto, UpdateDocumentConfigDto, SearchDocumentConfigDto } from "../dto/document-config.dto"; // Adjust path to your DTO
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class DocumentConfigService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo mới DocumentConfig kèm danh sách DocumentConfigItems (dùng Transaction)
   */
  async create(dto: CreateDocumentConfigDto) {
    const { items, ...configData } = dto;

    return this.prisma.documentConfig.create({
      data: {
        ...configData,
        items: items?.length
          ? {
              create: items.map((item) => ({
                name: item.name,
                code: item.code,
                required: item.required,
                sortOrder: item.sortOrder,
              })),
            }
          : undefined,
      },
      include: {
        items: true,
      },
    });
  }

  /**
   * Lấy danh sách phân trang & hỗ trợ tìm kiếm
   */
  async findAll(query: SearchDocumentConfigDto & { page?: number; limit?: number }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.name) {
      where.name = { contains: query.name, mode: "insensitive" };
    }
    if (query.admissionCampaignId) {
      where.admissionCampaignId = Number(query.admissionCampaignId);
    }
    if (query.educationLevel) {
      where.educationLevel = query.educationLevel;
    }
    if (query.trainingType) {
      where.trainingType = query.trainingType;
    }

    const [data, total] = await Promise.all([
      this.prisma.documentConfig.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: "desc" },
        include: {
          items: {
            orderBy: { sortOrder: "asc" },
          },
        },
      }),
      this.prisma.documentConfig.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Lấy chi tiết 1 DocumentConfig theo ID
   */
  async findOne(id: number) {
    const config = await this.prisma.documentConfig.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!config) {
      throw new NotFoundException(`DocumentConfig with ID ${id} not found`);
    }

    return config;
  }

  /**
   * Cập nhật DocumentConfig và làm mới danh sách Items
   */
  async update(id: number, dto: UpdateDocumentConfigDto) {
    await this.findOne(id); // Kiểm tra sự tồn tại

    const { items, ...configData } = dto;

    return this.prisma.$transaction(async (tx) => {
      // Nếu client truyền lại mảng items, xóa toàn bộ items cũ và thay bằng items mới
      if (items) {
        await tx.documentConfigItem.deleteMany({
          where: { documentConfigId: id },
        });
      }

      return tx.documentConfig.update({
        where: { id },
        data: {
          ...configData,
          items: items
            ? {
                create: items.map((item) => ({
                  name: item.name,
                  code: item.code,
                  required: item.required,
                  sortOrder: item.sortOrder,
                })),
              }
            : undefined,
        },
        include: {
          items: true,
        },
      });
    });
  }

  /**
   * Xóa DocumentConfig (Cascade sẽ tự động xóa các items liên quan)
   */
  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.documentConfig.delete({
      where: { id },
    });
  }
}
