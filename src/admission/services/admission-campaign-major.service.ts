import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import {
  UpdateAdmissionCampaignMajorDto,
  SearchAdmissionCampaignMajorDto,
} from "../dtos/admission-campaign-major.dto.js";

@Injectable()
export class AdmissionCampaignMajorService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: SearchAdmissionCampaignMajorDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.admissionCampaignId) {
      where.admissionCampaignId = Number(query.admissionCampaignId);
    }
    if (query.majorId) {
      where.majorId = Number(query.majorId);
    }
    if (query.trainingType) {
      where.trainingType = query.trainingType;
    }

    const [data, total] = await Promise.all([
      this.prisma.admissionCampaignMajor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: "desc" },
        include: {
          admissionCampaign: true,
          major: true,
          subjectCombination: { include: { items: true } },
          _count: { select: { admissionProfiles: true } },
        },
      }),
      this.prisma.admissionCampaignMajor.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: number) {
    const item = await this.prisma.admissionCampaignMajor.findUnique({
      where: { id },
      include: {
        admissionCampaign: true,
        major: true,
        subjectCombination: { include: { items: true } },
        admissionProfiles: true,
      },
    });
    if (!item) {
      throw new NotFoundException(`Chi tiết chỉ tiêu đợt tuyển sinh ID ${id} không tồn tại`);
    }
    return item;
  }

  async update(id: number, dto: UpdateAdmissionCampaignMajorDto) {
    await this.findOne(id);
    return this.prisma.admissionCampaignMajor.update({
      where: { id },
      data: dto,
      include: {
        admissionCampaign: true,
        major: true,
        subjectCombination: { include: { items: true } },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.admissionCampaignMajor.delete({
      where: { id },
    });
  }
}
