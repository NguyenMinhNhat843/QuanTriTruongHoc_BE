import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import {
  CreatePriorityRuleDto,
  UpdatePriorityRuleDto,
  SearchPriorityRuleDto,
} from "../dtos/priority-rule.dto.js";

@Injectable()
export class PriorityRuleService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePriorityRuleDto) {
    const existing = await this.prisma.priorityRule.findFirst({
      where: {
        academicYearId: dto.academicYearId,
        priorityRegion: dto.priorityRegion ?? undefined,
        priorityObject: dto.priorityObject ?? undefined,
      },
    });
    if (existing) {
      throw new BadRequestException("Quy tắc điểm ưu tiên cho diện này trong năm học đã tồn tại");
    }

    return this.prisma.priorityRule.create({
      data: dto,
      include: { academicYear: true },
    });
  }

  async findAll(query: SearchPriorityRuleDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.academicYearId) {
      where.academicYearId = Number(query.academicYearId);
    }
    if (query.priorityRegion) {
      where.priorityRegion = query.priorityRegion;
    }
    if (query.priorityObject) {
      where.priorityObject = query.priorityObject;
    }

    const [data, total] = await Promise.all([
      this.prisma.priorityRule.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: "desc" },
        include: { academicYear: true },
      }),
      this.prisma.priorityRule.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: number) {
    const rule = await this.prisma.priorityRule.findUnique({
      where: { id },
      include: { academicYear: true },
    });
    if (!rule) {
      throw new NotFoundException(`Quy tắc điểm ưu tiên ID ${id} không tồn tại`);
    }
    return rule;
  }

  async update(id: number, dto: UpdatePriorityRuleDto) {
    await this.findOne(id);
    return this.prisma.priorityRule.update({
      where: { id },
      data: dto,
      include: { academicYear: true },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.priorityRule.delete({ where: { id } });
  }
}

