import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { AcademicYearStatus } from "../../../prisma/generated/prisma/client.js";
import {
  CreateAdmissionCampaignDto,
  UpdateAdmissionCampaignDto,
  SearchAdmissionCampaignDto,
} from "../dtos/admission-campaign.dto.js";

@Injectable()
export class AdmissionCampaignService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAdmissionCampaignDto) {
    const existing = await this.prisma.admissionCampaign.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new BadRequestException(`Đợt tuyển sinh với mã ${dto.code} đã tồn tại`);
    }

    const { campaignMajors, ...data } = dto;
    return this.prisma.admissionCampaign.create({
      data: {
        ...data,
        campaignMajors: campaignMajors?.length
          ? {
              create: campaignMajors.map((item) => ({
                majorId: item.majorId,
                trainingType: item.trainingType,
                quota: item.quota,
                acceptedAdmissionTypes: item.acceptedAdmissionTypes,
                subjectCombinationId: item.subjectCombinationId,
                minScorePerSubject: item.minScorePerSubject,
                minTotalScore: item.minTotalScore,
                minGpaAverage: item.minGpaAverage,
                minConduct: item.minConduct,
                transcriptScoreMethod: item.transcriptScoreMethod,
                cutoffScore: item.cutoffScore,
              })),
            }
          : undefined,
      },
      include: {
        academicYear: true,
        campaignMajors: {
          include: { major: true, subjectCombination: true },
        },
      },
    });
  }

  async findAll(query: SearchAdmissionCampaignDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.name) {
      where.name = { contains: query.name, mode: "insensitive" };
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.academicYearId) {
      where.academicYearId = Number(query.academicYearId);
    }

    const [data, total] = await Promise.all([
      this.prisma.admissionCampaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          academicYear: {
            select: { id: true, code: true, status: true, isCurrent: true },
          },
          campaignMajors: {
            include: { major: true, subjectCombination: true },
          },
        },
      }),
      this.prisma.admissionCampaign.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findActiveCampaigns() {
    return this.prisma.admissionCampaign.findMany({
      where: {
        academicYear: {
          status: AcademicYearStatus.ACTIVE,
        },
      },
      orderBy: { startDate: "asc" },
      include: {
        academicYear: {
          select: { id: true, code: true, status: true, isCurrent: true },
        },
        campaignMajors: {
          include: { major: true, subjectCombination: true },
        },
      },
    });
  }

  async findOne(id: number) {
    const campaign = await this.prisma.admissionCampaign.findUnique({
      where: { id },
      include: {
        academicYear: true,
        campaignMajors: {
          include: { major: true, subjectCombination: true },
        },
        documentConfigs: {
          include: { items: true },
        },
      },
    });
    if (!campaign) {
      throw new NotFoundException(`Đợt tuyển sinh ID ${id} không tồn tại`);
    }
    return campaign;
  }

  async update(id: number, dto: UpdateAdmissionCampaignDto) {
    await this.findOne(id);
    const { campaignMajors, ...data } = dto;

    if (campaignMajors) {
      return this.prisma.$transaction(async (tx) => {
        await tx.admissionCampaignMajor.deleteMany({
          where: { admissionCampaignId: id },
        });
        return tx.admissionCampaign.update({
          where: { id },
          data: {
            ...data,
            campaignMajors: {
              create: campaignMajors.map((item) => ({
                majorId: item.majorId,
                trainingType: item.trainingType,
                quota: item.quota,
                acceptedAdmissionTypes: item.acceptedAdmissionTypes,
                subjectCombinationId: item.subjectCombinationId,
                minScorePerSubject: item.minScorePerSubject,
                minTotalScore: item.minTotalScore,
                minGpaAverage: item.minGpaAverage,
                minConduct: item.minConduct,
                transcriptScoreMethod: item.transcriptScoreMethod,
                cutoffScore: item.cutoffScore,
              })),
            },
          },
          include: {
            academicYear: true,
            campaignMajors: { include: { major: true, subjectCombination: true } },
          },
        });
      });
    }

    return this.prisma.admissionCampaign.update({
      where: { id },
      data,
      include: {
        academicYear: true,
        campaignMajors: { include: { major: true, subjectCombination: true } },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.admissionCampaign.delete({
      where: { id },
    });
  }
}

