import { Injectable, NotFoundException } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import {
  CreateTuitionPeriodDto,
  SearchTuitionPeriodDto,
  TuitionPeriodDto,
  UpdateTuitionPeriodDto,
} from "../dto/tuition-period.dto"; // Thay đổi đường dẫn import DTO cho đúng
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class TuitionPeriodService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo mới một đợt thu học phí
   */
  async create(createDto: CreateTuitionPeriodDto): Promise<TuitionPeriodDto> {
    const newPeriod = await this.prisma.tuitionPeriod.create({
      data: {
        ...createDto,
        isActive: true, // Gán giá trị mặc định hệ thống
      },
    });

    return plainToInstance(TuitionPeriodDto, newPeriod, {
      excludeExtraneousValues: false, // Giữ lại cấu trúc phẳng từ database trả ra
    });
  }

  /**
   * Lấy danh sách đợt thu học phí kèm bộ lọc tìm kiếm theo tên (Search)
   */
  async findAll(
    searchDto: SearchTuitionPeriodDto,
  ): Promise<TuitionPeriodDto[]> {
    const { name, semesterId } = searchDto;
    const where: any = {};

    // Lọc theo tên (không phân biệt hoa thường)
    if (name) {
      where.name = {
        contains: name,
        mode: "insensitive",
      };
    }

    // Lọc theo học kỳ (ép kiểu số để tránh lỗi Prisma)
    if (semesterId !== undefined && semesterId !== null) {
      where.semesterId = Number(semesterId);
    }

    const periods = await this.prisma.tuitionPeriod.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    return plainToInstance(TuitionPeriodDto, periods);
  }

  /**
   * Chi tiết một đợt thu học phí dựa vào ID
   */
  async findOne(id: number): Promise<TuitionPeriodDto> {
    const period = await this.prisma.tuitionPeriod.findUnique({
      where: { id },
    });

    if (!period) {
      throw new NotFoundException(`Tuition period with ID ${id} not found`);
    }

    return plainToInstance(TuitionPeriodDto, period);
  }

  /**
   * Cập nhật đợt thu học phí
   */
  async update(
    id: number,
    updateDto: UpdateTuitionPeriodDto,
  ): Promise<TuitionPeriodDto> {
    // Kiểm tra bản ghi tồn tại trước khi cập nhật
    await this.findOne(id);

    const updatedPeriod = await this.prisma.tuitionPeriod.update({
      where: { id },
      data: updateDto,
    });

    return plainToInstance(TuitionPeriodDto, updatedPeriod);
  }

  /**
   * Xóa một đợt thu học phí
   */
  async remove(id: number): Promise<{ message: string }> {
    // Kiểm tra bản ghi tồn tại trước khi xóa
    await this.findOne(id);

    await this.prisma.tuitionPeriod.delete({
      where: { id },
    });

    return { message: `Deleted tuition period with ID ${id} successfully` };
  }
}
