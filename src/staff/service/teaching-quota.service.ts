import { Injectable, NotFoundException } from "@nestjs/common";
import {
  CreateTeachingQuotaDto,
  SearchTeachingQuotaDto,
  TeachingQuotaPaginationResponseDto,
  UpdateTeachingQuotaDto,
} from "../dto/teaching-quota.dto";
import { PrismaService } from "../../prisma/prisma.service";
import { Prisma } from "../../../prisma/generated/prisma/client";

@Injectable()
export class TeachingQuotaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTeachingQuotaDto) {
    return this.prisma.teachingQuota.create({
      data: dto,
    });
  }

  async findAll(query: SearchTeachingQuotaDto): Promise<TeachingQuotaPaginationResponseDto> {
    const { page = 1, limit = 10, staffId, teachingLevelId, academicYearId } = query;
    const skip = (page - 1) * limit;

    // Khởi tạo điều kiện truy vấn Prisma
    const where: Prisma.TeachingQuotaWhereInput = {};

    if (staffId) {
      where.staffId = Number(staffId);
    }

    if (teachingLevelId) {
      where.teachingLevelId = Number(teachingLevelId);
    }

    // Lọc theo năm học thông qua bảng TeachingLevel
    if (academicYearId) {
      where.teachingLevel = {
        academicYearId: Number(academicYearId),
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.teachingQuota.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          teachingLevel: {
            include: {
              academicYear: true,
            },
          },
        },
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
