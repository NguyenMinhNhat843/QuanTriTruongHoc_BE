import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import {
  CreateVillageDto,
  UpdateVillageDto,
  SearchVillageDto,
} from "../dto/village.dto";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class VillageService {
  constructor(private readonly prisma: PrismaService) {}

  // CREATE
  async create(createVillageDto: CreateVillageDto) {
    // Kiểm tra xem Xã/Phường trực thuộc (wardCode) có tồn tại thực tế không
    const wardExists = await this.prisma.ward.findUnique({
      where: { code: createVillageDto.wardCode },
    });
    if (!wardExists) {
      throw new BadRequestException(
        `Ward with code ${createVillageDto.wardCode} does not exist`,
      );
    }

    return this.prisma.village.create({
      data: createVillageDto,
    });
  }

  // READ ALL & SEARCH (Hỗ trợ đắc lực cho dropdown phân cấp lọc Thôn theo Xã)
  async findAll(query: SearchVillageDto) {
    const { name, wardCode } = query;

    return this.prisma.village.findMany({
      where: {
        wardCode: wardCode ? { equals: wardCode } : undefined,
        name: name ? { contains: name, mode: "insensitive" } : undefined,
      },
      // include: { ward: true } // Mở comment nếu muốn lấy kèm thông tin Xã
    });
  }

  // READ ONE
  async findOne(id: number) {
    const village = await this.prisma.village.findUnique({
      where: { id },
      include: {
        ward: {
          include: { province: true }, // Lấy quần thể trọn vẹn: Thôn -> Xã -> Tỉnh
        },
      },
    });

    if (!village) {
      throw new NotFoundException(`Village with ID ${id} not found`);
    }
    return village;
  }

  // UPDATE
  async update(id: number, updateVillageDto: UpdateVillageDto) {
    await this.findOne(id); // Đảm bảo thôn có tồn tại

    // Nếu có cập nhật thuộc tính wardCode, bắt buộc check tính hợp lệ của Xã mới
    if (updateVillageDto.wardCode) {
      const wardExists = await this.prisma.ward.findUnique({
        where: { code: updateVillageDto.wardCode },
      });
      if (!wardExists) {
        throw new BadRequestException(
          `Ward with code ${updateVillageDto.wardCode} does not exist`,
        );
      }
    }

    return this.prisma.village.update({
      where: { id },
      data: updateVillageDto,
    });
  }

  // DELETE
  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.village.delete({
      where: { id },
    });
  }
}
