import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import {
  CreateProvinceDto,
  SearchProvinceDto,
  UpdateProvinceDto,
} from "../dto/province.dto";

@Injectable()
export class ProvinceService {
  constructor(private readonly prisma: PrismaService) {}

  // CREATE
  async create(createProvinceDto: CreateProvinceDto) {
    // Kiểm tra trùng mã code trước khi tạo (vì code là chuỗi do client truyền lên, không tự tăng)
    const existing = await this.prisma.province.findUnique({
      where: { code: createProvinceDto.code },
    });
    if (existing) {
      throw new ConflictException(
        `Province with code ${createProvinceDto.code} already exists`,
      );
    }

    return this.prisma.province.create({
      data: createProvinceDto,
    });
  }

  // READ ALL & SEARCH
  async findAll(query: SearchProvinceDto) {
    const { code, name, fullName, codeName } = query;

    return this.prisma.province.findMany({
      where: {
        code: code ? { equals: code } : undefined,
        name: name ? { contains: name, mode: "insensitive" } : undefined,
        fullName: fullName
          ? { contains: fullName, mode: "insensitive" }
          : undefined,
        codeName: codeName
          ? { contains: codeName, mode: "insensitive" }
          : undefined,
      },
    });
  }

  // READ ONE
  async findOne(code: string) {
    const province = await this.prisma.province.findUnique({
      where: { code },
      // Bạn có thể include thêm 'wards' nếu route này cần lấy cả danh sách Xã/Phường
    });

    if (!province) {
      throw new NotFoundException(`Province with code ${code} not found`);
    }
    return province;
  }

  // UPDATE
  async update(code: string, updateProvinceDto: UpdateProvinceDto) {
    // Đảm bảo tỉnh tồn tại trước khi cập nhật
    await this.findOne(code);

    return this.prisma.province.update({
      where: { code },
      data: updateProvinceDto,
    });
  }

  // DELETE
  async remove(code: string) {
    // Đảm bảo tỉnh tồn tại trước khi xóa
    await this.findOne(code);

    return this.prisma.province.delete({
      where: { code },
    });
  }
}
