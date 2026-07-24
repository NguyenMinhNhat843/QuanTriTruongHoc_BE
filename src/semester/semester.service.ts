import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  ConflictException,
  Logger,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateSemesterDto, FindAllSemestersQueryDto, UpdateSemesterDto } from "./semester.dto";
import { SemesterResponseDto } from "./semester.response";
import { Prisma } from "../../prisma/generated/prisma/client";
import { plainToInstance } from "class-transformer";

@Injectable()
export class SemesterService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateSemesterDto, tx?: Prisma.TransactionClient): Promise<SemesterResponseDto> {
    const client = tx || this.prisma;

    try {
      const status = data.isCurrent ? ("ACTIVE" as any) : data.status || ("UPCOMING" as any);

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

      // Tạo đợt đánh giá điểm rèn luyên
      await client.evaluationPeriod.create({
        data: {
          semesterId: semester.id,
          name: `Đợt đánh giá HK${semester.term} ${semester.year} - ${semester.year! + 1}`,
          isActive: true,
          isFrozen: false,
        },
      });

      return plainToInstance(SemesterResponseDto, semester);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException(`Học kỳ ${data.term} năm ${data.year} đã tồn tại trong hệ thống`);
      }

      console.error("Lỗi khi tạo học kỳ:", error);
      throw new InternalServerErrorException("Lỗi hệ thống khi tạo học kỳ");
    }
  }
  async findAll(query?: FindAllSemestersQueryDto): Promise<SemesterResponseDto[]> {
    // 1. Thêm classId vào phần bóc tách dữ liệu từ query
    const { studentId, batchId, classId } = query || {};
    let targetBatchId = batchId ? Number(batchId) : undefined;
    let whereCondition: any = {};

    // 2. Nếu có classId, truy vấn để lấy batchId của lớp học đó
    if (classId) {
      const classroom = await this.prisma.class.findUnique({
        where: { id: Number(classId) },
        select: { batchId: true },
      });

      if (!classroom) {
        throw new BadRequestException("Không tìm thấy thông tin lớp học.");
      }

      if (classroom.batchId) {
        targetBatchId = classroom.batchId;
      }
    }

    // 3. Nếu có studentId (Giữ nguyên logic cũ của bạn)
    if (studentId) {
      const student = await this.prisma.student.findUnique({
        where: { id: Number(studentId) },
        select: { batchId: true },
      });

      if (!student) {
        throw new BadRequestException("Không tìm thấy thông tin sinh viên.");
      }

      if (student.batchId) {
        targetBatchId = student.batchId;
      }
    }

    // 4. Nếu xác định được Khóa học (Batch), tính toán khoảng học kỳ theo chương trình khung
    if (targetBatchId) {
      // Lấy startYear và danh sách semesterNumber tối đa từ chương trình khung của Batch
      const batch = await this.prisma.batch.findUnique({
        where: { id: targetBatchId },
        select: {
          startYear: true,
          curriculum: {
            select: {
              curriculumSubjects: {
                select: { semesterNumber: true },
              },
            },
          },
        },
      });

      if (!batch) {
        throw new BadRequestException("Không tìm thấy thông tin khóa học (Batch).");
      }

      const startYear = batch.startYear;
      const startTerm = 1; // Theo đặc tả: Mặc định kỳ 1 của khóa học bắt đầu tại Term 1

      // Tìm học kỳ lớn nhất (semesterNumberMax) có trong chương trình khung
      const semesterNumbers = batch.curriculum?.curriculumSubjects.map((cs) => cs.semesterNumber) || [];
      const maxSemesterNumber = semesterNumbers.length > 0 ? Math.max(...semesterNumbers) : 4; // Mặc định là 4 nếu CTK trống

      // Tổng số bước nhảy kỳ tính từ kỳ gốc (kỳ 1 tương đương bước nhảy 0)
      const totalTermSteps = maxSemesterNumber - 1;

      // Tính toán năm kết thúc và kỳ kết thúc
      const endYear = startYear + Math.floor((startTerm - 1 + totalTermSteps) / 2);
      const endTerm = ((startTerm - 1 + totalTermSteps) % 2) + 1; // Trả về 1 hoặc 2

      // Xây dựng điều kiện lọc chính xác cho bảng Semester
      whereCondition = {
        OR: [
          // Trường hợp 1: Nằm hoàn toàn ở các năm giữa năm bắt đầu và năm kết thúc
          {
            year: {
              gt: startYear,
              lt: endYear,
            },
          },
          // Trường hợp 2: Nếu là năm bắt đầu, lấy từ Term 1 trở đi
          {
            year: startYear,
            term: { gte: startTerm },
          },
          // Trường hợp 3: Nếu là năm kết thúc, chỉ lấy đến hết EndTerm vừa tính được
          {
            year: endYear,
            term: { lte: endTerm },
          },
        ],
      };
    }

    // 5. Truy vấn dữ liệu từ Database
    const semesters = await this.prisma.semester.findMany({
      where: whereCondition,
      orderBy: [{ year: "asc" }, { term: "asc" }],
      include: {
        _count: { select: { classSubjects: true } },
      },
    });

    return plainToInstance(SemesterResponseDto, semesters);
  }

  async findOne(id: number): Promise<SemesterResponseDto> {
    const semester = await this.prisma.semester.findUnique({
      where: { id },
      include: {
        _count: { select: { classSubjects: true } },
      },
    });

    if (!semester) {
      throw new NotFoundException(`Không tìm thấy học kỳ với ID ${id}`);
    }
    return plainToInstance(SemesterResponseDto, semester);
  }

  async update(id: number, data: UpdateSemesterDto): Promise<SemesterResponseDto> {
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

        return plainToInstance(SemesterResponseDto, updated);
      });
    } catch (error) {
      Logger.error("Lỗi khi cập nhật học kỳ:", error);
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
    if (!semester) throw new NotFoundException("Chưa thiết lập học kỳ hiện tại");
    return plainToInstance(SemesterResponseDto, semester);
  }
}
