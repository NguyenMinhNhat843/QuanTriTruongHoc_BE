import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AttendanceDto, CreateAttendanceDto, AttendanceDetailDto } from "../dto/attendance.dto";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 1. LẤY DANH SÁCH ĐIỂM DANH (Có bộ lọc tùy chọn)
   */
  async findAll(query?: {
    classSubjectId?: number;
    scheduleDetailId?: number;
    studentId?: number;
  }): Promise<AttendanceDetailDto[]> {
    const where: any = {};

    if (query?.classSubjectId) where.classSubjectId = query.classSubjectId;
    if (query?.scheduleDetailId) where.scheduleDetailId = query.scheduleDetailId;
    if (query?.studentId) where.studentId = query.studentId;

    return this.prisma.attendance.findMany({
      where,
      include: {
        student: true,
        scheduleDetail: true,
        classSubject: true,
        recordBy: true,
      },
      orderBy: { recordedAt: "desc" },
    });
  }

  /**
   * 2. LẤY CHI TIẾT 1 BẢN GHI ĐIỂM DANH
   */
  async findOne(id: number): Promise<AttendanceDetailDto> {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id },
      include: {
        student: true,
        scheduleDetail: true,
        classSubject: true,
        recordBy: true,
      },
    });

    if (!attendance) {
      throw new NotFoundException(`Không tìm thấy điểm danh với ID #${id}`);
    }

    return attendance;
  }

  /**
   * 3. TẠO MỚI / ĐIỂM DANH 1 SINH VIÊN
   */
  async create(dto: CreateAttendanceDto, userId: number | null): Promise<AttendanceDto> {
    // Kiểm tra trùng lặp (1 sinh viên chỉ điểm danh 1 lần trong 1 buổi học)
    const existingRecord = await this.prisma.attendance.findFirst({
      where: {
        studentId: dto.studentId,
        scheduleDetailId: dto.scheduleDetailId,
      },
    });

    if (existingRecord) {
      throw new BadRequestException("Sinh viên này đã được điểm danh trong buổi học!");
    }

    return this.prisma.attendance.create({
      data: {
        studentId: dto.studentId,
        classSubjectId: dto.classSubjectId,
        scheduleDetailId: dto.scheduleDetailId,
        status: dto.status,
        note: dto.note,
        recordedById: userId,
      },
    });
  }

  /**
   * 4. ĐIỂM DANH HÀNG LOẠT (BULK UPSERT - giáo viên lưu cả lớp)
   */
  async bulkAttendance(
    scheduleDetailId: number,
    classSubjectId: number,
    recordedById: number,
    attendances: Array<{ studentId: number; status: any; note?: string }>,
  ) {
    const operations = attendances.map((item) =>
      this.prisma.attendance.upsert({
        where: {
          studentId_scheduleDetailId: {
            scheduleDetailId,
            studentId: item.studentId,
          },
        },
        update: {
          status: item.status,
          note: item.note,
          recordedById,
          recordedAt: new Date(),
        },
        create: {
          studentId: item.studentId,
          classSubjectId,
          scheduleDetailId,
          status: item.status,
          note: item.note,
          recordedById,
        },
      }),
    );

    // Chạy trong 1 Transaction để đảm bảo tính toàn vẹn dữ liệu
    return this.prisma.$transaction(operations);
  }

  /**
   * 5. CẬP NHẬT ĐIỂM DANH
   */
  async update(id: number, dto: Partial<CreateAttendanceDto>, userId: number | null): Promise<AttendanceDto> {
    await this.findOne(id); // Check xem bản ghi có tồn tại không

    return this.prisma.attendance.update({
      where: { id },
      data: {
        ...dto,
        recordedById: userId,
        recordedAt: new Date(),
      },
    });
  }

  /**
   * 6. XÓA BẢN GHI ĐIỂM DANH
   */
  async remove(id: number): Promise<{ message: string }> {
    await this.findOne(id);

    await this.prisma.attendance.delete({
      where: { id },
    });

    return { message: `Xóa thành công bản ghi điểm danh #${id}` };
  }
}
