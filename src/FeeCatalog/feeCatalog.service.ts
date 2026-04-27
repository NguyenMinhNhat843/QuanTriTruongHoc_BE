import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateFeeCatalogDto, UpdateFeeCatalogDto } from "./feeCatalog.dto";

@Injectable()
export class FeeCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Tạo mới cấu hình phí
  async create(createFeeCatalogDto: CreateFeeCatalogDto) {
    // Kiểm tra xem FeeId có tồn tại không trước khi tạo
    const feeExists = await this.prisma.fee.findUnique({
      where: { id: createFeeCatalogDto.feeId },
    });

    if (!feeExists) {
      throw new NotFoundException(
        `Danh mục phí (Fee) với ID ${createFeeCatalogDto.feeId} không tồn tại`,
      );
    }

    return this.prisma.feeCatalog.create({
      data: createFeeCatalogDto,
      include: {
        fee: true, // Trả về kèm thông tin tên phí để tiện hiển thị
      },
    });
  }

  // 2. Lấy danh sách tất cả các cấu hình phí
  async findAll() {
    return this.prisma.feeCatalog.findMany({
      include: {
        fee: {
          select: { name: true },
        },
        // Nếu project của bạn có model Major và Batch, hãy include để hiển thị tên
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  // 3. Lấy chi tiết một cấu hình
  async findOne(id: number) {
    const catalog = await this.prisma.feeCatalog.findUnique({
      where: { id },
      include: {
        fee: true,
      },
    });

    if (!catalog) {
      throw new NotFoundException(`Không tìm thấy cấu hình phí với ID: ${id}`);
    }

    return catalog;
  }

  // 4. Cập nhật cấu hình phí
  async update(id: number, updateFeeCatalogDto: UpdateFeeCatalogDto) {
    const { feeId, ...rest } = updateFeeCatalogDto;
    try {
      return await this.prisma.feeCatalog.update({
        where: { id },
        data: {
          ...rest,
          fee: {
            connect: feeId ? { id: feeId } : undefined,
          },
        },
        include: {
          fee: true,
        },
      });
    } catch (error) {
      console.error(`Lỗi khi cập nhật cấu hình phí với ID ${id}:`, error);
      throw new NotFoundException(
        `Cập nhật thất bại, cấu hình ID ${id} không tồn tại`,
      );
    }
  }

  // 5. Xóa cấu hình phí
  async remove(id: number) {
    try {
      return await this.prisma.feeCatalog.delete({
        where: { id },
      });
    } catch (error) {
      console.error(`Lỗi khi xóa cấu hình phí với ID ${id}:`, error);
      throw new NotFoundException(
        `Xóa thất bại, cấu hình ID ${id} không tồn tại`,
      );
    }
  }
}
