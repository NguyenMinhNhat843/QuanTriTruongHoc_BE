import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service"; // Đảm bảo đường dẫn đúng tới PrismaService
import { CreateBatchDto, UpdateBatchDto } from "./batch.dto";

@Injectable()
export class BatchService {
  constructor(private prisma: PrismaService) {}

  // 1. TẠO MỚI KHÓA ĐÀO TẠO
  async create(createBatchDto: CreateBatchDto) {
    // Kiểm tra logic năm học
    if (createBatchDto.endYear < createBatchDto.startYear) {
      throw new BadRequestException(
        "Năm kết thúc phải lớn hơn hoặc bằng năm bắt đầu",
      );
    }

    const existing = await this.prisma.batch.findUnique({
      where: { batchCode: createBatchDto.batchCode },
    });

    if (existing) {
      throw new BadRequestException("batchCode đã tồn tại");
    }

    const { majorId, ...rest } = createBatchDto;

    return this.prisma.batch.create({
      data: {
        ...rest,
        major: {
          connect: { id: majorId },
        },
      },
    });
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

    return await this.prisma.batch.update({
      where: { id },
      data: updateBatchDto,
    });
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
