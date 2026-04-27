import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service"; // Đảm bảo đường dẫn đúng tới PrismaService
import { CreateBatchDto, UpdateBatchDto } from "./batch.dto";
import { Prisma } from "../../prisma/generated/prisma/client";

@Injectable()
export class BatchService {
  constructor(private prisma: PrismaService) {}

  // 1. TẠO MỚI KHÓA ĐÀO TẠO
  async create(createBatchDto: CreateBatchDto) {
    try {
      // Kiểm tra logic năm học
      if (createBatchDto.endYear < createBatchDto.startYear) {
        throw new BadRequestException(
          "Năm kết thúc phải lớn hơn hoặc bằng năm bắt đầu",
        );
      }

      return await this.prisma.batch.create({
        data: createBatchDto,
      });
    } catch (error) {
      // Bắt lỗi trùng batchCode (Unique constraint) từ Prisma
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new ConflictException(
            `Mã khóa học '${createBatchDto.batchCode}' đã tồn tại.`,
          );
        }
      }
      throw error;
    }
  }

  // 2. LẤY TẤT CẢ DANH SÁCH KHÓA ĐÀO TẠO
  async findAll() {
    return await this.prisma.batch.findMany({
      include: {
        _count: {
          select: {
            students: true,
            classes: true,
          },
        },
      },
      orderBy: {
        startYear: "desc",
      },
    });
  }

  // 3. CẬP NHẬT THÔNG TIN KHÓA
  async update(id: number, updateBatchDto: UpdateBatchDto) {
    // Kiểm tra xem khóa có tồn tại không trước khi update
    const existingBatch = await this.prisma.batch.findUnique({
      where: { id },
    });

    if (!existingBatch) {
      throw new NotFoundException(`Không tìm thấy khóa đào tạo với ID #${id}`);
    }

    // Nếu cập nhật năm, kiểm tra lại logic năm học
    const startYear = updateBatchDto.startYear ?? existingBatch.startYear;
    const endYear = updateBatchDto.endYear ?? existingBatch.endYear;

    if (endYear < startYear) {
      throw new BadRequestException(
        "Năm kết thúc phải lớn hơn hoặc bằng năm bắt đầu",
      );
    }

    try {
      return await this.prisma.batch.update({
        where: { id },
        data: updateBatchDto,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new ConflictException(`Mã khóa học này đã được sử dụng.`);
        }
      }
      throw error;
    }
  }

  // 4. LẤY CHI TIẾT 1 KHÓA (Bổ sung để dễ quản lý)
  async findOne(id: number) {
    const batch = await this.prisma.batch.findUnique({
      where: { id },
      include: {
        classes: true, // Để xem khóa này có những lớp nào
      },
    });

    if (!batch) {
      throw new NotFoundException(`Không tìm thấy khóa đào tạo với ID #${id}`);
    }
    return batch;
  }
}
