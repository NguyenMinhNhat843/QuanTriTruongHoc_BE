import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { MajorResponseDto } from "./major.response";
import { CreateMajorDto, UpdateMajorDto } from "./major.dto";

@Injectable()
export class MajorService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateMajorDto): Promise<MajorResponseDto> {
    const { deptId, majorCode } = data;

    // 1. Kiểm tra phòng ban (Department) có tồn tại không
    const department = await this.prisma.department.findUnique({
      where: { id: deptId },
    });
    if (!department) {
      throw new NotFoundException(`Không tìm thấy phòng ban với ID ${deptId}`);
    }

    // 2. Kiểm tra trùng mã ngành (majorCode)
    const existingMajor = await this.prisma.major.findUnique({
      where: { majorCode },
    });
    if (existingMajor) {
      throw new ConflictException(`Mã ngành ${majorCode} đã tồn tại`);
    }

    try {
      const major = await this.prisma.major.create({
        data,
        include: { department: true }, // Include để trả về thông tin khoa
      });
      return new MajorResponseDto(major);
    } catch (error) {
      console.log("Lỗi khi tạo ngành học:", error);
      throw new InternalServerErrorException("Lỗi khi tạo ngành học");
    }
  }

  async findAll(): Promise<MajorResponseDto[]> {
    const majors = await this.prisma.major.findMany({
      include: {
        department: true,
        _count: { select: { classes: true } },
      },
    });
    return majors.map((major) => new MajorResponseDto(major));
  }

  async findOne(id: number): Promise<MajorResponseDto> {
    const major = await this.prisma.major.findUnique({
      where: { id },
      include: { department: true, _count: { select: { classes: true } } },
    });

    if (!major) {
      throw new NotFoundException(`Không tìm thấy ngành học với ID ${id}`);
    }
    return new MajorResponseDto(major);
  }

  async update(id: number, data: UpdateMajorDto): Promise<MajorResponseDto> {
    // Kiểm tra tồn tại
    await this.findOne(id);

    // Nếu cập nhật deptId, kiểm tra xem phòng ban mới có tồn tại không
    if (data.deptId) {
      const dept = await this.prisma.department.findUnique({
        where: { id: data.deptId },
      });
      if (!dept) throw new NotFoundException("Phòng ban mới không tồn tại");
    }

    try {
      const updatedMajor = await this.prisma.major.update({
        where: { id },
        data,
        include: { department: true },
      });
      return new MajorResponseDto(updatedMajor);
    } catch (error) {
      console.log("Lỗi khi cập nhật ngành học:", error);
      throw new InternalServerErrorException("Lỗi khi cập nhật ngành học");
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.major.delete({ where: { id } });
  }
}
