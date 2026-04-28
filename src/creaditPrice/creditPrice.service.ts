import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateCreditPriceDto, UpdateCreditPriceDto } from "./creditPrice.dto";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CreditPriceService {
  constructor(private prisma: PrismaService) {}

  /**
   * Tạo mới mức giá tín chỉ
   */
  async create(data: CreateCreditPriceDto) {
    return this.prisma.creditPrice.create({
      data: {
        price: data.price,
        isGlobal: data.isGlobal ?? false,
        semester: data.semester,
        // Kết nối quan hệ nếu có ID
        majorId: data.majorId,
        batchId: data.batchId,
      },
    });
  }

  /**
   * Lấy danh sách giá tín chỉ
   * Bao gồm cả thông tin Major và Batch để hiển thị ở Frontend
   */
  async findAll() {
    return this.prisma.creditPrice.findMany({
      include: {
        major: true,
        batch: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Cập nhật thông tin giá tín chỉ
   */
  async update(id: number, data: UpdateCreditPriceDto) {
    // Kiểm tra tồn tại trước khi update
    await this.findOne(id);

    return this.prisma.creditPrice.update({
      where: { id },
      data,
    });
  }

  /**
   * Tìm một bản ghi cụ thể (Helper function)
   */
  async findOne(id: number) {
    const record = await this.prisma.creditPrice.findUnique({
      where: { id },
      include: { major: true, batch: true },
    });

    if (!record) {
      throw new NotFoundException(
        `Không tìm thấy mức giá tín chỉ với ID ${id}`,
      );
    }
    return record;
  }
}
