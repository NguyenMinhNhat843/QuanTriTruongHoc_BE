import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import {
  CreateAdmissionProfileDto,
  UpdateAdmissionProfileDto,
  SearchAdmissionProfileDto,
} from "../dto/admission-profile.dto"; // Adjust path to your DTO
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AdmissionProfileService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper: Sinh mã hồ sơ dạng "HSYYYY-XXXX" (VD: HS2026-0001)
   */
  private async generateApplicationCode(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `HS${year}-`;

    const lastProfile = await this.prisma.admissionProfile.findFirst({
      where: { applicationCode: { startsWith: prefix } },
      orderBy: { id: "desc" },
      select: { applicationCode: true },
    });

    if (!lastProfile) {
      return `${prefix}0001`;
    }

    const lastNumber = parseInt(lastProfile.applicationCode.replace(prefix, ""), 10);
    const nextNumber = (lastNumber + 1).toString().padStart(4, "0");

    return `${prefix}${nextNumber}`;
  }

  /**
   * Tạo mới hồ sơ đăng ký xét tuyển
   */
  async create(dto: CreateAdmissionProfileDto) {
    // Check trùng 1 thí sinh đăng ký cùng ngành trong cùng 1 đợt tuyển sinh
    const existing = await this.prisma.admissionProfile.findUnique({
      where: {
        admissionCampaignId_majorId_identityNumber: {
          admissionCampaignId: dto.admissionCampaignId,
          majorId: dto.majorId,
          identityNumber: dto.identityNumber,
        },
      },
    });

    if (existing) {
      throw new BadRequestException("Thí sinh đã đăng ký ngành này trong đợt tuyển sinh hiện tại");
    }

    const applicationCode = await this.generateApplicationCode();

    return this.prisma.admissionProfile.create({
      data: {
        ...dto,
        applicationCode,
      },
      include: {
        admissionCampaign: true,
        major: true,
        examScores: true,
        documents: true,
      },
    });
  }

  /**
   * Lấy danh sách hồ sơ (phân trang + lọc theo nhiều tiêu chí)
   */
  async findAll(query: SearchAdmissionProfileDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.applicationCode) {
      where.applicationCode = { contains: query.applicationCode, mode: "insensitive" };
    }
    if (query.fullName) {
      where.fullName = { contains: query.fullName, mode: "insensitive" };
    }
    if (query.identityNumber) {
      where.identityNumber = { contains: query.identityNumber, mode: "insensitive" };
    }
    if (query.phone) {
      where.phone = { contains: query.phone, mode: "insensitive" };
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.admissionCampaignId) {
      where.admissionCampaignId = Number(query.admissionCampaignId);
    }
    if (query.majorId) {
      where.majorId = Number(query.majorId);
    }

    const [data, total] = await Promise.all([
      this.prisma.admissionProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          admissionCampaign: true,
          major: true,
        },
      }),
      this.prisma.admissionProfile.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  /**
   * Lấy chi tiết 1 hồ sơ kèm các thông tin liên quan
   */
  async findOne(id: number) {
    const profile = await this.prisma.admissionProfile.findUnique({
      where: { id },
      include: {
        admissionCampaign: true,
        major: true,
        examScores: true,
        documents: {
          include: {
            documentConfigItem: true,
          },
        },
        statusLogs: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException(`AdmissionProfile with ID ${id} not found`);
    }

    return profile;
  }

  /**
   * Cập nhật thông tin hồ sơ
   */
  async update(id: number, dto: UpdateAdmissionProfileDto) {
    await this.findOne(id);

    return this.prisma.admissionProfile.update({
      where: { id },
      data: dto,
      include: {
        admissionCampaign: true,
        major: true,
        examScores: true,
      },
    });
  }

  /**
   * Xóa hồ sơ (xóa kéo theo examScores, documents, statusLogs nhờ onDelete: Cascade trong Prisma)
   */
  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.admissionProfile.delete({
      where: { id },
    });
  }
}
