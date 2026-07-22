import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import {
  CreateAdmissionDocumentDto,
  VerifyAdmissionDocumentDto,
} from "../dtos/admission-document.dto.js";

@Injectable()
export class AdmissionDocumentService {
  constructor(private readonly prisma: PrismaService) {}

  async uploadDocument(dto: CreateAdmissionDocumentDto) {
    // Soft deprecate previous active files for the same document item
    await this.prisma.admissionDocument.updateMany({
      where: {
        admissionProfileId: dto.admissionProfileId,
        documentConfigItemId: dto.documentConfigItemId,
      },
      data: { isLatest: false },
    });

    return this.prisma.admissionDocument.create({
      data: {
        ...dto,
        isLatest: true,
      },
      include: {
        documentConfigItem: true,
      },
    });
  }

  async findByProfile(admissionProfileId: number) {
    return this.prisma.admissionDocument.findMany({
      where: { admissionProfileId },
      orderBy: { uploadedAt: "desc" },
      include: {
        documentConfigItem: true,
        verifiedByUser: { select: { id: true, username: true } },
      },
    });
  }

  async verifyDocument(id: number, dto: VerifyAdmissionDocumentDto, userId?: number) {
    const doc = await this.prisma.admissionDocument.findUnique({ where: { id } });
    if (!doc) {
      throw new NotFoundException(`Tài liệu ID ${id} không tồn tại`);
    }

    return this.prisma.admissionDocument.update({
      where: { id },
      data: {
        status: dto.status,
        rejectionReason: dto.rejectionReason || null,
        verifiedAt: new Date(),
        verifiedByUserId: userId || null,
      },
      include: {
        documentConfigItem: true,
        verifiedByUser: { select: { id: true, username: true } },
      },
    });
  }

  async remove(id: number) {
    const doc = await this.prisma.admissionDocument.findUnique({ where: { id } });
    if (!doc) {
      throw new NotFoundException(`Tài liệu ID ${id} không tồn tại`);
    }
    return this.prisma.admissionDocument.delete({ where: { id } });
  }
}

