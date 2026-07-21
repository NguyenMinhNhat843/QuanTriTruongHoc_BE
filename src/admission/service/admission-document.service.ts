import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import {
  CreateAdmissionDocumentDto,
  UpdateAdmissionDocumentDto,
  SearchAdmissionDocumentDto,
} from "../dto/admission-document.dto"; // Adjust path
import { DocumentStatus } from "../../../prisma/generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { UploadFileService } from "../../upload/upload.service";

@Injectable()
export class AdmissionDocumentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadFileService,
  ) {}

  /**
   * Tải file giấy tờ lên Cloudinary & Lưu vào CSDL
   */
  async createWithFile(dto: CreateAdmissionDocumentDto, file: Express.Multer.File) {
    // 1. Kiểm tra hồ sơ tuyển sinh có tồn tại không
    const profile = await this.prisma.admissionProfile.findUnique({
      where: { id: Number(dto.admissionProfileId) },
    });
    if (!profile) {
      throw new NotFoundException(`AdmissionProfile with ID ${dto.admissionProfileId} not found`);
    }

    // 2. Upload file lên Cloudinary qua UploadService
    const uploadResult = await this.uploadService.uploadImageAndSaveDb(file, "admission-documents");

    // 3. Cập nhật trạng thái FileStore thành đã sử dụng
    await this.prisma.fileStore.update({
      where: { id: uploadResult.id },
      data: { isUsed: true },
    });

    // 4. Lưu thông tin AdmissionDocument
    return this.prisma.admissionDocument.create({
      data: {
        admissionProfileId: Number(dto.admissionProfileId),
        documentConfigItemId: Number(dto.documentConfigItemId),
        fileUrl: uploadResult.imageUrl,
        fileName: file.originalname,
        fileSize: file.size,
        status: DocumentStatus.PENDING,
      },
      include: {
        documentConfigItem: true,
      },
    });
  }

  /**
   * Lấy danh sách giấy tờ (Phân trang + Lọc)
   */
  async findAll(query: SearchAdmissionDocumentDto) {
    const where: any = {};

    if (query.admissionProfileId) {
      where.admissionProfileId = Number(query.admissionProfileId);
    }
    if (query.documentConfigItemId) {
      where.documentConfigItemId = Number(query.documentConfigItemId);
    }
    if (query.status) {
      where.status = query.status;
    }

    const [data] = await Promise.all([
      this.prisma.admissionDocument.findMany({
        where,
        orderBy: { uploadedAt: "desc" },
        include: {
          documentConfigItem: true,
        },
      }),
    ]);

    return data;
  }

  /**
   * Xem chi tiết 1 giấy tờ
   */
  async findOne(id: number) {
    const document = await this.prisma.admissionDocument.findUnique({
      where: { id },
      include: {
        admissionProfile: true,
        documentConfigItem: true,
      },
    });

    if (!document) {
      throw new NotFoundException(`AdmissionDocument with ID ${id} not found`);
    }

    return document;
  }

  /**
   * Cập nhật thông tin giấy tờ (có thể thay thế file mới nếu truyền file)
   */
  async update(id: number, dto: UpdateAdmissionDocumentDto, file?: Express.Multer.File) {
    await this.findOne(id);

    let fileData = {};

    // Nếu người dùng tải đè file mới
    if (file) {
      const uploadResult = await this.uploadService.uploadImageAndSaveDb(file, "admission-documents");

      await this.prisma.fileStore.update({
        where: { id: uploadResult.id },
        data: { isUsed: true },
      });

      fileData = {
        fileUrl: uploadResult.imageUrl,
        fileName: file.originalname,
        fileSize: file.size,
        status: DocumentStatus.PENDING, // Đưa về PENDING để cán bộ duyệt lại
      };
    }

    return this.prisma.admissionDocument.update({
      where: { id },
      data: {
        ...dto,
        ...fileData,
      },
      include: {
        documentConfigItem: true,
      },
    });
  }

  /**
   * Cán bộ duyệt hoặc từ chối giấy tờ
   */
  async verifyDocument(id: number, status: DocumentStatus, verifiedByUserId: number, rejectionReason?: string) {
    await this.findOne(id);

    if (status === DocumentStatus.REJECTED && !rejectionReason) {
      throw new BadRequestException("Cần cung cấp lý do từ chối tài liệu");
    }

    return this.prisma.admissionDocument.update({
      where: { id },
      data: {
        status,
        verifiedByUserId,
        verifiedAt: new Date(),
        rejectionReason: status === DocumentStatus.REJECTED ? rejectionReason : null,
      },
    });
  }

  /**
   * Xóa giấy tờ
   */
  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.admissionDocument.delete({
      where: { id },
    });
  }
}
