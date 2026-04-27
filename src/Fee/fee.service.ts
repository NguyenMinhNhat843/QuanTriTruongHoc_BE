import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateFeeDto, UpdateFeeDto } from "./fee.dto";

@Injectable()
export class FeeService {
  constructor(private readonly prisma: PrismaService) {}

  // Tạo mới danh mục phí
  async create(createFeeDto: CreateFeeDto) {
    return this.prisma.fee.create({
      data: createFeeDto,
    });
  }

  // Lấy tất cả danh mục phí (bao gồm cả các cấu hình tiền trong Catalog)
  async findAll() {
    return this.prisma.fee.findMany({
      include: {
        feeCatalogs: true, // Để xem danh mục này đang áp dụng ở đâu, bao nhiêu tiền
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  // Lấy chi tiết một danh mục
  async findOne(id: number) {
    const fee = await this.prisma.fee.findUnique({
      where: { id },
      include: { feeCatalogs: true },
    });
    if (!fee) throw new NotFoundException(`Không tìm thấy Fee với ID: ${id}`);
    return fee;
  }

  // Cập nhật danh mục
  async update(id: number, updateFeeDto: UpdateFeeDto) {
    try {
      return await this.prisma.fee.update({
        where: { id },
        data: updateFeeDto,
      });
    } catch (error) {
      console.error(`Lỗi khi cập nhật Fee với ID ${id}:`, error);
      throw new NotFoundException(`Cập nhật thất bại, ID ${id} không tồn tại`);
    }
  }

  // Xóa danh mục
  async remove(id: number) {
    try {
      return await this.prisma.fee.delete({
        where: { id },
      });
    } catch (error) {
      console.error(`Lỗi khi xóa Fee với ID ${id}:`, error);
      throw new NotFoundException(`Xóa thất bại, ID ${id} không tồn tại`);
    }
  }
}
