import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import {
  CreateAdmissionInterestDto,
  SearchAdmissionInterestDto,
} from "../dtos/admission-interest.dto.js";

@Injectable()
export class AdmissionInterestService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAdmissionInterestDto) {
    return this.prisma.admissionInterest.create({
      data: dto,
      include: { major: true },
    });
  }

  async findAll(query: SearchAdmissionInterestDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.fullName) {
      where.fullName = { contains: query.fullName, mode: "insensitive" };
    }
    if (query.phone) {
      where.phone = { contains: query.phone, mode: "insensitive" };
    }
    if (query.majorId) {
      where.majorId = Number(query.majorId);
    }
    if (query.trainingType) {
      where.trainingType = query.trainingType;
    }
    if (query.isNotified !== undefined) {
      where.notifiedAt = query.isNotified ? { not: null } : null;
    }

    const [data, total] = await Promise.all([
      this.prisma.admissionInterest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { major: true },
      }),
      this.prisma.admissionInterest.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async markAsNotified(id: number) {
    const item = await this.prisma.admissionInterest.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Nhu cầu tư vấn ID ${id} không tồn tại`);
    }

    return this.prisma.admissionInterest.update({
      where: { id },
      data: { notifiedAt: new Date() },
      include: { major: true },
    });
  }

  async remove(id: number) {
    const item = await this.prisma.admissionInterest.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Nhu cầu tư vấn ID ${id} không tồn tại`);
    }
    return this.prisma.admissionInterest.delete({ where: { id } });
  }
}

