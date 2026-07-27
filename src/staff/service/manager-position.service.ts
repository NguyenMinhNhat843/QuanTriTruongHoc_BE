import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import {
  CreateManagementPositionDto,
  SearchManagementPositionDto,
  UpdateManagementPositionDto,
} from "../dto/management-position.dto";

@Injectable()
export class ManagementPositionService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. CREATE
  async create(dto: CreateManagementPositionDto) {
    return this.prisma.managementPosition.create({
      data: dto,
    });
  }

  // 2. GET ALL / SEARCH (Hàm getData lấy toàn bộ danh sách)
  async getData(query: SearchManagementPositionDto) {
    const { code, name, isActive } = query;

    return this.prisma.managementPosition.findMany({
      where: {
        ...(code && { code: { contains: code, mode: "insensitive" } }),
        ...(name && { name: { contains: name, mode: "insensitive" } }),
        ...(isActive !== undefined && { isActive }),
      },
      orderBy: {
        priority: "asc",
      },
    });
  }

  // 3. FIND ONE BY ID
  async findOne(id: number) {
    const item = await this.prisma.managementPosition.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException(`Không tìm thấy chức vụ quản lý với ID #${id}`);
    }

    return item;
  }

  // 4. UPDATE
  async update(id: number, dto: UpdateManagementPositionDto) {
    await this.findOne(id); // Kiểm tra tồn tại trước khi update

    return this.prisma.managementPosition.update({
      where: { id },
      data: dto,
    });
  }

  // 5. DELETE
  async remove(id: number) {
    await this.findOne(id); // Kiểm tra tồn tại trước khi xóa

    return this.prisma.managementPosition.delete({
      where: { id },
    });
  }
}
