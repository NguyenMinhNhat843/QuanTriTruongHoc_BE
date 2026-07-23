import { Injectable, NotFoundException, InternalServerErrorException, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { AcademicYearStatus, CampaignStatus, Prisma } from "../../../prisma/generated/prisma/client.js";
import {
  CreateAdmissionCampaignDto,
  UpdateAdmissionCampaignDto,
  SearchAdmissionCampaignDto,
  FindActiveCampaignDto,
} from "../dtos/admission-campaign.dto.js";

@Injectable()
export class AdmissionCampaignService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateAdmissionCampaignDto) {
    const { campaignMajors, ...campaignData } = createDto;

    try {
      // Bọc toàn bộ vào 1 Transaction
      return await this.prisma.$transaction(async (tx) => {
        // 1. Tạo AdmissionCampaign trước
        const campaign = await tx.admissionCampaign.create({
          data: campaignData,
        });

        // 2. Tạo danh sách CampaignMajors sau (nếu có)
        if (campaignMajors && campaignMajors.length > 0) {
          const majorsToCreate = campaignMajors.map((major) => ({
            ...major,
            admissionCampaignId: campaign.id,
            subjectCombinationId: major.subjectCombinationId,
            minScorePerSubject: major.minScorePerSubject ?? null,
            minTotalScore: major.minTotalScore ?? null,
            minConduct: major.minConduct ?? null,
            cutoffScore: major.cutoffScore ?? null,
          }));

          await tx.admissionCampaignMajor.createMany({
            data: majorsToCreate,
          });
        }

        // 3. Trả về campaign kèm theo danh sách majors vừa tạo
        return tx.admissionCampaign.findUnique({
          where: { id: campaign.id },
          include: {
            campaignMajors: true,
          },
        });
      });
    } catch (error) {
      Logger.error("Error creating admission campaign:", error);
      throw new InternalServerErrorException("Có lỗi xảy ra khi tạo đợt tuyển sinh.");
    }
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
        },
      }),
      this.prisma.admissionCampaign.count({ where }),
    ]);

    return { data, total };
  }

  async findActiveCampaigns(query?: FindActiveCampaignDto) {
    const { majorId, trainingType } = query || {};

    // 1. Điều kiện chung: Năm học ACTIVE và Đợt tuyển sinh đang mở (OPEN)
    const whereCondition: Prisma.AdmissionCampaignWhereInput = {
      status: CampaignStatus.OPEN, // Lọc các đợt đang nhận hồ sơ
      academicYear: {
        status: AcademicYearStatus.ACTIVE,
      },
    };

    // 2. Nếu truyền majorId hoặc trainingType -> Lọc thông qua bảng trung gian campaignMajors (some)
    if (majorId || trainingType) {
      whereCondition.campaignMajors = {
        some: {
          ...(majorId && { majorId: Number(majorId) }),
          ...(trainingType && { trainingType }),
        },
      };
    }

    return this.prisma.admissionCampaign.findMany({
      where: whereCondition,
      orderBy: { startDate: "asc" },
      include: {
        academicYear: {
          select: { id: true, code: true, status: true, isCurrent: true },
        },
        // Trả về luôn thông tin Ngành & Hệ mở trong đợt này (có filter theo query nếu có)
        campaignMajors: {
          where: {
            ...(majorId && { majorId: Number(majorId) }),
            ...(trainingType && { trainingType }),
          },
          include: {
            major: {
              select: { id: true, majorCode: true, majorName: true },
            },
            subjectCombination: {
              include: {
                items: true,
              },
            },
          },
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
                subjectCombinationId: item.subjectCombinationId,
                minScorePerSubject: item.minScorePerSubject,
                minTotalScore: item.minTotalScore,
                minConduct: item.minConduct,
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
