import { Injectable, NotFoundException } from "@nestjs/common";
import {
  CreateTeachingLevelDto,
  SearchTeachingLevelDto,
  TeachingLevelPaginationResponseDto,
  UpdateTeachingLevelDto,
} from "../dto/teaching-level.dto";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class TeachingLevelService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTeachingLevelDto) {
    return this.prisma.teachingLevel.create({
      data: dto,
    });
  }

  async findAll(query: SearchTeachingLevelDto): Promise<TeachingLevelPaginationResponseDto> {
    const { page = 1, limit = 10, code, name, academicYearId } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (code) {
      where.code = { contains: code, mode: "insensitive" };
    }
    if (name) {
      where.name = { contains: name, mode: "insensitive" };
    }
    if (academicYearId) {
      where.academicYearId = academicYearId;
    }

    const [data, total] = await Promise.all([
      this.prisma.teachingLevel.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.teachingLevel.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(id: number) {
    const item = await this.prisma.teachingLevel.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException(`Không tìm thấy TeachingLevel với ID: ${id}`);
    }

    return item;
  }

  async update(id: number, dto: UpdateTeachingLevelDto) {
    await this.findOne(id); // Kiểm tra tồn tại trước khi update

    return this.prisma.teachingLevel.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Kiểm tra tồn tại trước khi xóa

    return this.prisma.teachingLevel.delete({
      where: { id },
    });
  }
}
