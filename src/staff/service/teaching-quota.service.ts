import { Injectable, NotFoundException } from "@nestjs/common";
import {
  CreateTeachingQuotaDto,
  SearchTeachingQuotaDto,
  TeachingQuotaPaginationResponseDto,
  UpdateTeachingQuotaDto,
} from "../dto/teaching-quota.dto";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class TeachingQuotaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTeachingQuotaDto) {
    return this.prisma.teachingQuota.create({
      data: dto,
    });
  }

  async findAll(query: SearchTeachingQuotaDto): Promise<TeachingQuotaPaginationResponseDto> {
    const { page = 1, limit = 10, staffId, teachingLevelId } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (staffId) {
      where.staffId = staffId;
    }
    if (teachingLevelId) {
      where.teachingLevelId = teachingLevelId;
    }

    const [data, total] = await Promise.all([
      this.prisma.teachingQuota.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.teachingQuota.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(id: number) {
    const item = await this.prisma.teachingQuota.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException(`Không tìm thấy TeachingQuota với ID: ${id}`);
    }

    return item;
  }

  async update(id: number, dto: UpdateTeachingQuotaDto) {
    await this.findOne(id);

    return this.prisma.teachingQuota.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.teachingQuota.delete({
      where: { id },
    });
  }
}
