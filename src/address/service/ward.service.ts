import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { CreateWardDto, UpdateWardDto, SearchWardDto } from "../dto/ward.dto";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class WardService {
  constructor(private readonly prisma: PrismaService) {}

  // CREATE
  async create(createWardDto: CreateWardDto) {
    // 1. Kiểm tra mã code Xã/Phường đã tồn tại chưa
    const existingWard = await this.prisma.ward.findUnique({
      where: { code: createWardDto.code },
    });
    if (existingWard) {
      throw new ConflictException(
        `Ward with code ${createWardDto.code} already exists`,
      );
    }

    // 2. Kiểm tra xem Tỉnh (provinceCode) có tồn tại trong DB không
    const provinceExists = await this.prisma.province.findUnique({
      where: { code: createWardDto.provinceCode },
    });
    if (!provinceExists) {
      throw new BadRequestException(
        `Province with code ${createWardDto.provinceCode} does not exist`,
      );
    }

    return this.prisma.ward.create({
      data: createWardDto,
    });
  }

  // READ ALL & SEARCH (Thường dùng để lọc Xã theo Tỉnh)
  async findAll(query: SearchWardDto) {
    const { code, name, fullName, codeName, provinceCode } = query;

    return this.prisma.ward.findMany({
      where: {
        code: code ? { equals: code } : undefined,
        provinceCode: provinceCode ? { equals: provinceCode } : undefined,
        name: name ? { contains: name, mode: "insensitive" } : undefined,
        fullName: fullName
          ? { contains: fullName, mode: "insensitive" }
          : undefined,
        codeName: codeName
          ? { contains: codeName, mode: "insensitive" }
          : undefined,
      },
      // Có thể kèm theo thông tin Tỉnh nếu muốn hiển thị ở client:
      // include: { province: true }
    });
  }

  // READ ONE
  async findOne(code: string) {
    const ward = await this.prisma.ward.findUnique({
      where: { code },
      include: { province: true }, // Trả về kèm thông tin tỉnh trực thuộc
    });

    if (!ward) {
      throw new NotFoundException(`Ward with code ${code} not found`);
    }
    return ward;
  }

  // UPDATE
  async update(code: string, updateWardDto: UpdateWardDto) {
    await this.findOne(code);

    // Nếu cập nhật cả provinceCode thì phải kiểm tra xem Tỉnh mới đó có tồn tại không
    if (updateWardDto.provinceCode) {
      const provinceExists = await this.prisma.province.findUnique({
        where: { code: updateWardDto.provinceCode },
      });
      if (!provinceExists) {
        throw new BadRequestException(
          `Province with code ${updateWardDto.provinceCode} does not exist`,
        );
      }
    }

    return this.prisma.ward.update({
      where: { code },
      data: updateWardDto,
    });
  }

  // DELETE
  async remove(code: string) {
    await this.findOne(code);

    return this.prisma.ward.delete({
      where: { code },
    });
  }
}
