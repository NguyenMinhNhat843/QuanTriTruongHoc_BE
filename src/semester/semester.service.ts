import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateSemesterDto, UpdateSemesterDto } from "./semester.dto";
import { SemesterResponseDto } from "./semester.response";
import { Prisma } from "../../prisma/generated/prisma/client";

@Injectable()
export class SemesterService {
  constructor(private prisma: PrismaService) {}

  async create(
    data: CreateSemesterDto,
    tx?: Prisma.TransactionClient,
  ): Promise<SemesterResponseDto> {
    const client = tx || this.prisma;

    try {
      const status = data.isCurrent
        ? ("ACTIVE" as any)
        : data.status || ("UPCOMING" as any);

      if (data.isCurrent) {
        await client.semester.updateMany({
          where: { isCurrent: true },
          data: {
            isCurrent: false,
          },
        });
      }

      const semester = await client.semester.create({
        data: {
          name: data.name,
          term: data.term,
          year: data.year,
          schoolYear: data.schoolYear,
          teachingWeeks: data.teachingWeeks,
          isCurrent: data.isCurrent ?? false,
          status: status,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
        },
      });

      return new SemesterResponseDto(semester);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException(
          `Học kỳ ${data.term} năm ${data.year} đã tồn tại trong hệ thống`,
        );
      }

      console.error("Lỗi khi tạo học kỳ:", error);
      throw new InternalServerErrorException("Lỗi hệ thống khi tạo học kỳ");
    }
  }
  async findAll(): Promise<SemesterResponseDto[]> {
    const semesters = await this.prisma.semester.findMany({
      orderBy: [{ year: "asc" }, { term: "asc" }],
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
