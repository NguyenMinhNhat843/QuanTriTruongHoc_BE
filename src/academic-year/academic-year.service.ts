import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAcademicYearDto, SearchAcademicYearDto, UpdateAcademicYearDto } from "./academic-year.dto";

@Injectable()
export class AcademicYearService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo mới Năm học
   */
  async create(dto: CreateAcademicYearDto) {
    // 1. Kiểm tra trùng mã code
    const existingCode = await this.prisma.academicYear.findUnique({
      where: { code: dto.code },
    });
    if (existingCode) {
      throw new BadRequestException(`Mã năm học "${dto.code}" đã tồn tại!`);
    }

    // 2. Kiểm tra logic ngày bắt đầu/kết thúc
    if (new Date(dto.startDate) >= new Date(dto.endDate)) {
      throw new BadRequestException("Ngày bắt đầu phải nhỏ hơn ngày kết thúc!");
    }

    // 3. Nếu đánh dấu là năm học hiện tại (isCurrent = true), reset các năm học khác thành false
    if (dto.isCurrent) {
      await this.resetCurrentAcademicYear();
    }

    return this.prisma.academicYear.create({
      data: dto,
    });
  }

  /**
   * Lấy danh sách có Tìm kiếm & Phân trang
   */
  async findAll(query: SearchAcademicYearDto) {
    const { page = 1, limit = 10, code, status, isCurrent } = query;
    const skip = (page - 1) * limit;

    // Dynamic Filter
    const where: any = {};

    if (code) {
      where.code = { contains: code, mode: "insensitive" };
    }
    if (status) {
      where.status = status;
    }
    if (isCurrent !== undefined) {
      where.isCurrent = Boolean(isCurrent);
    }

    const [data, total] = await Promise.all([
      this.prisma.academicYear.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { startDate: "desc" },
      }),
      this.prisma.academicYear.count({ where }),
    ]);

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Lấy chi tiết 1 Năm học theo ID
   */
  async findOne(id: number) {
    const academicYear = await this.prisma.academicYear.findUnique({
      where: { id },
    });

    if (!academicYear) {
      throw new NotFoundException(`Không tìm thấy năm học với ID: ${id}`);
    }

    return academicYear;
  }

  /**
   * Cập nhật thông tin Năm học
   */
  async update(id: number, dto: UpdateAcademicYearDto) {
    // 1. Kiểm tra tồn tại
    await this.findOne(id);

    // 2. Nếu sửa code, kiểm tra trùng lặp
    if (dto.code) {
      const existingCode = await this.prisma.academicYear.findFirst({
        where: {
          code: dto.code,
          NOT: { id },
        },
      });
      if (existingCode) {
        throw new BadRequestException(`Mã năm học "${dto.code}" đã bị trùng!`);
      }
    }

    // 3. Kiểm tra logic ngày tháng nếu có cập nhật
    if (dto.startDate && dto.endDate) {
      if (new Date(dto.startDate) >= new Date(dto.endDate)) {
        throw new BadRequestException("Ngày bắt đầu phải nhỏ hơn ngày kết thúc!");
      }
    }

    // 4. Nếu bật isCurrent = true, unset tất cả các bản ghi khác
    if (dto.isCurrent) {
      await this.resetCurrentAcademicYear(id);
    }

    return this.prisma.academicYear.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Xóa Năm học theo ID
   */
  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.academicYear.delete({
      where: { id },
    });
  }

  /**
   * Helper Private: Đặt tất cả bản ghi isCurrent về false (trừ bản ghi ngoại lệ nếu có)
   */
  private async resetCurrentAcademicYear(excludeId?: number) {
    await this.prisma.academicYear.updateMany({
      where: {
        isCurrent: true,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      data: { isCurrent: false },
    });
  }
}
