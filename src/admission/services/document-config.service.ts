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
                sortOrder: item.sortOrder || 0,
              })),
            }
          : undefined,
      },
      include: { items: true, admissionCampaign: true },
    });
  }

  async findAll(query: SearchDocumentConfigDto) {
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
        orderBy: { id: "desc" },
        include: { items: true, admissionCampaign: true },
      }),
      this.prisma.documentConfig.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: number) {
    const config = await this.prisma.documentConfig.findUnique({
      where: { id },
      include: { items: { orderBy: { sortOrder: "asc" } }, admissionCampaign: true },
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
                sortOrder: item.sortOrder || 0,
              })),
            },
          },
          include: { items: true, admissionCampaign: true },
        });
      });
    }

    return this.prisma.documentConfig.update({
      where: { id },
      data,
      include: { items: true, admissionCampaign: true },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.documentConfig.delete({ where: { id } });
  }
}

