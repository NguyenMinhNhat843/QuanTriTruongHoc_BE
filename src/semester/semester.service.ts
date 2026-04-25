import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateSemesterDto, UpdateSemesterDto } from "./semester.dto";
import { SemesterResponseDto } from "./semester.response";

@Injectable()
export class SemesterService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateSemesterDto): Promise<SemesterResponseDto> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Nếu học kỳ mới là Current, bỏ đánh dấu các học kỳ cũ
        if (data.isCurrent) {
          await tx.semester.updateMany({
            where: { isCurrent: true },
            data: { isCurrent: false },
          });
        }

        const semester = await tx.semester.create({
          data: {
            ...data,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
          },
        });

        return new SemesterResponseDto(semester);
      });
    } catch (error) {
      console.log("Lỗi khi tạo học kỳ:", error);
      throw new InternalServerErrorException("Lỗi hệ thống khi tạo học kỳ");
    }
  }

  async findAll(): Promise<SemesterResponseDto[]> {
    const semesters = await this.prisma.semester.findMany({
      orderBy: { startDate: "desc" },
      include: {
        _count: { select: { courseOffers: true, feeInvoices: true } },
      },
    });
    return semesters.map((s) => new SemesterResponseDto(s));
  }

  async findOne(id: number): Promise<SemesterResponseDto> {
    const semester = await this.prisma.semester.findUnique({
      where: { id },
      include: {
        _count: { select: { courseOffers: true, feeInvoices: true } },
      },
    });

    if (!semester) {
      throw new NotFoundException(`Không tìm thấy học kỳ với ID ${id}`);
    }
    return new SemesterResponseDto(semester);
  }

  async update(
    id: number,
    data: UpdateSemesterDto,
  ): Promise<SemesterResponseDto> {
    await this.findOne(id); // Check existence

    try {
      return await this.prisma.$transaction(async (tx) => {
        if (data.isCurrent) {
          await tx.semester.updateMany({
            where: { isCurrent: true, id: { not: id } },
            data: { isCurrent: false },
          });
        }

        const updated = await tx.semester.update({
          where: { id },
          data: {
            ...data,
            startDate: data.startDate ? new Date(data.startDate) : undefined,
            endDate: data.endDate ? new Date(data.endDate) : undefined,
          },
        });

        return new SemesterResponseDto(updated);
      });
    } catch (error) {
      console.log("Lỗi khi cập nhật học kỳ:", error);
      throw new InternalServerErrorException("Lỗi khi cập nhật học kỳ");
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.semester.delete({ where: { id } });
  }

  async getCurrentSemester(): Promise<SemesterResponseDto> {
    const semester = await this.prisma.semester.findFirst({
      where: { isCurrent: true },
    });
    if (!semester)
      throw new NotFoundException("Chưa thiết lập học kỳ hiện tại");
    return new SemesterResponseDto(semester);
  }
}
