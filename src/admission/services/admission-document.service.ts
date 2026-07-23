import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { CreateAdmissionDocumentDto, VerifyAdmissionDocumentDto } from "../dtos/admission-document.dto.js";
import { UploadFileService } from "../../upload/upload.service.js";
import { extractPublicIdFromUrl } from "../../utils/extractPublicIdfromUrl.js";

@Injectable()
export class AdmissionDocumentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadFileService,
  ) {}

  async uploadDocument(file: Express.Multer.File, dto: CreateAdmissionDocumentDto) {
    // 1. Upload file lên Cloudinary thông qua UploadService
    const uploadResult = await this.uploadService.uploadImageAndSaveDb(
      file,
      "admission-documents", // Tên thư mục mong muốn trên Cloudinary
    );

    const profileId = Number(dto.admissionProfileId);
    const configItemId = Number(dto.documentConfigItemId);

    // 2. Chạy Transaction để đảm bảo tính nhất quán dữ liệu
    return this.prisma.$transaction(async (tx) => {
      // Đánh dấu các bản ghi cũ không còn là bản ghi mới nhất
      await tx.admissionDocument.updateMany({
        where: {
          admissionProfileId: profileId,
          documentConfigItemId: configItemId,
        },
        data: { isLatest: false },
      });

      // Tạo bản ghi mới với dữ liệu từ file đã upload
      return tx.admissionDocument.create({
        data: {
          admissionProfileId: profileId,
          documentConfigItemId: configItemId,
          fileUrl: uploadResult.imageUrl,
          fileName: file.originalname,
          fileSize: file.size,
          isLatest: true,
        },
        include: {
          documentConfigItem: true,
        },
      });
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
    // 1. Kiểm tra tài liệu có tồn tại không
    const doc = await this.prisma.admissionDocument.findUnique({
      where: { id },
    });

    if (!doc) {
      throw new NotFoundException(`Tài liệu ID ${id} không tồn tại`);
    }

    // 2. Xóa file trên Cloudinary (nếu trích xuất được publicId)
    if (doc.fileUrl) {
      const publicId = extractPublicIdFromUrl(doc.fileUrl);
      if (publicId) {
        try {
          await this.uploadService.deleteImage(publicId);
        } catch (error) {
          // Log lỗi lại để theo dõi, nhưng không chặn việc xóa record DB nếu bạn muốn ưu tiên làm sạch DB
          console.error(`Lỗi khi xóa ảnh trên Cloudinary (publicId: ${publicId}):`, error);
        }
      }
    }

    // 3. Nếu tài liệu bị xóa đang là bản ghi mới nhất (isLatest = true),
    // ta nên tự động cập nhật bản ghi cũ gần nhất kế tiếp thành isLatest = true
    if (doc.isLatest) {
      await this.prisma.$transaction(async (tx) => {
        // Xóa bản ghi hiện tại
        await tx.admissionDocument.delete({ where: { id } });

        // Tìm bản ghi kế tiếp gần đây nhất của cùng hồ sơ và loại tài liệu
        const previousDoc = await tx.admissionDocument.findFirst({
          where: {
            admissionProfileId: doc.admissionProfileId,
            documentConfigItemId: doc.documentConfigItemId,
          },
          orderBy: { id: "desc" },
        });

        // Nếu tìm thấy, cập nhật isLatest = true
        if (previousDoc) {
          await tx.admissionDocument.update({
            where: { id: previousDoc.id },
            data: { isLatest: true },
          });
        }
      });

      return { message: `Đã xóa tài liệu ID ${id} và cập nhật lại phiên bản mới nhất` };
    }

    // 4. Nếu không phải isLatest thì chỉ cần xóa bình thường
    return this.prisma.admissionDocument.delete({ where: { id } });
  }
}
