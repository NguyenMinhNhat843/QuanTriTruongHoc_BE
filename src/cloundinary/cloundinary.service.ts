// cloudinary.service.ts
import { Injectable, BadRequestException } from "@nestjs/common";
import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from "cloudinary";
import { Readable } from "stream"; // <--- Dùng module có sẵn của Node.js
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CloudinaryService {
  constructor(private prisma: PrismaService) {}
  /**
   * 1. Upload ảnh bằng Buffer sử dụng Node.js Native Stream
   */
  async uploadImage(
    file: Express.Multer.File,
    folder: string = "Home/QuanTriTruongHoc",
  ): Promise<{ id: string; imageUrl: string; publicId: string }> {
    if (!file) {
      throw new BadRequestException("File không hợp lệ hoặc không tồn tại");
    }

    const cloundinaryResult = await new Promise<UploadApiResponse>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: folder, resource_type: "auto" },
          (error?: UploadApiErrorResponse, result?: UploadApiResponse) => {
            if (error)
              return reject(
                new BadRequestException(`Upload thất bại: ${error.message}`),
              );
            if (!result)
              return reject(
                new BadRequestException(
                  "Upload thất bại: Không nhận được phản hồi từ Cloudinary",
                ),
              );

            resolve(result);
          },
        );

        Readable.from(file.buffer).pipe(uploadStream);
      },
    );

    const savedFile = await this.prisma.fileStore.create({
      data: {
        imageUrl: cloundinaryResult.secure_url,
        publicId: cloundinaryResult.public_id,
        isUsed: false,
      },
    });

    return {
      id: savedFile.id,
      imageUrl: savedFile.imageUrl,
      publicId: savedFile.publicId,
    };
  }

  /**
   * 2. Xóa ảnh bằng Public ID (Giữ nguyên)
   */
  async deleteImage(
    publicId: string,
  ): Promise<{ success: boolean; message: string }> {
    if (!publicId) {
      throw new BadRequestException("Vui lòng cung cấp publicId để xóa ảnh");
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId);

      if (result.result !== "ok") {
        throw new BadRequestException(
          "Không tìm thấy ảnh hoặc xóa thất bại trên Cloudinary",
        );
      }

      return { success: true, message: "Xóa ảnh thành công!" };
    } catch (error: any) {
      throw new BadRequestException(`Xóa ảnh thất bại: ${error?.message}`);
    }
  }
}
