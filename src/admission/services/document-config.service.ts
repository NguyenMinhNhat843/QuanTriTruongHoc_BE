import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import {
  CreateDocumentConfigDto,
  UpdateDocumentConfigDto,
  SearchDocumentConfigDto,
} from "../dtos/document-config.dto.js";

@Injectable()
export class DocumentConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDocumentConfigDto) {
    const { items, ...data } = dto;
    return this.prisma.documentConfig.create({
      data: {
        ...data,
        items: items?.length
          ? {
              create: items.map((item) => ({
                name: item.name,
                code: item.code,
                required: item.required ?? true,
                sortOrder: item.sortOrder ?? 0,
              })),
            }
          : undefined,
      },
      include: { items: true },
    });
  }

  async findAll(query: SearchDocumentConfigDto) {
    const where: any = {};
    if (query.id) {
      where.id = Number(query.id);
    }
    if (query.name) {
      where.name = { contains: query.name, mode: "insensitive" };
    }

    const [data] = await Promise.all([
      this.prisma.documentConfig.findMany({
        where,
        orderBy: { id: "desc" },
        include: { items: { orderBy: { sortOrder: "asc" } } },
      }),
    ]);

    return data;
  }

  async findLatestBeforeDate(targetDateInput: Date | string) {
    const targetDate = new Date(targetDateInput);

    const config = await this.prisma.documentConfig.findFirst({
      where: {
        startDate: {
          lt: targetDate,
        },
      },
      orderBy: {
        startDate: "desc",
      },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!config) {
      throw new NotFoundException(`Không tìm thấy cấu hình hồ sơ nào trước ngày ${targetDate.toISOString()}`);
    }

    return config;
  }

  async findOne(id: number) {
    const config = await this.prisma.documentConfig.findUnique({
      where: { id },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });
    if (!config) {
      throw new NotFoundException(`Cấu hình hồ sơ ID ${id} không tồn tại`);
    }
    return config;
  }

  async update(id: number, dto: UpdateDocumentConfigDto) {
    await this.findOne(id);
    const { items, ...data } = dto;

    if (items) {
      return this.prisma.$transaction(async (tx) => {
        await tx.documentConfigItem.deleteMany({ where: { documentConfigId: id } });
        return tx.documentConfig.update({
          where: { id },
          data: {
            ...data,
            items: {
              create: items.map((item) => ({
                name: item.name,
                code: item.code,
                required: item.required ?? true,
                sortOrder: item.sortOrder ?? 0,
              })),
            },
          },
          include: { items: true },
        });
      });
    }

    return this.prisma.documentConfig.update({
      where: { id },
      data,
      include: { items: true },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.documentConfig.delete({ where: { id } });
  }
}
