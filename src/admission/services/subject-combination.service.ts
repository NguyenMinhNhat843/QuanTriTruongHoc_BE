import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import {
  CreateSubjectCombinationDto,
  UpdateSubjectCombinationDto,
  SearchSubjectCombinationDto,
} from "../dtos/subject-combination.dto.js";

@Injectable()
export class SubjectCombinationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSubjectCombinationDto) {
    const existing = await this.prisma.subjectCombination.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new BadRequestException(`Tổ hợp môn với mã ${dto.code} đã tồn tại`);
    }

    return this.prisma.subjectCombination.create({
      data: {
        code: dto.code,
        name: dto.name,
        items: dto.items?.length
          ? {
              create: dto.items.map((item) => ({
                subjectCode: item.subjectCode,
              })),
            }
          : undefined,
      },
      include: { items: true },
    });
  }

  async findAll(query: SearchSubjectCombinationDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.code) {
      where.code = { contains: query.code, mode: "insensitive" };
    }
    if (query.name) {
      where.name = { contains: query.name, mode: "insensitive" };
    }

    const [data, total] = await Promise.all([
      this.prisma.subjectCombination.findMany({
        where,
        skip,
        take: limit,
        orderBy: { code: "asc" },
        include: { items: true },
      }),
      this.prisma.subjectCombination.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(id: number) {
    const item = await this.prisma.subjectCombination.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!item) {
      throw new NotFoundException(`Tổ hợp môn ID ${id} không tồn tại`);
    }
    return item;
  }

  async update(id: number, dto: UpdateSubjectCombinationDto) {
    await this.findOne(id);
    const { items, ...data } = dto;

    if (items) {
      return this.prisma.$transaction(async (tx) => {
        await tx.subjectCombinationItem.deleteMany({
          where: { subjectCombinationId: id },
        });
        return tx.subjectCombination.update({
          where: { id },
          data: {
            ...data,
            items: {
              create: items.map((item) => ({
                subjectCode: item.subjectCode,
              })),
            },
          },
          include: { items: true },
        });
      });
    }

    return this.prisma.subjectCombination.update({
      where: { id },
      data,
      include: { items: true },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.subjectCombination.delete({
      where: { id },
    });
  }
}
