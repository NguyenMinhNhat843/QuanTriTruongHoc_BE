import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AttendanceDetailDto, AttendanceDto, CreateAttendanceDto } from "../dto/attendance.dto";
import { PrismaService } from "../../prisma/prisma.service";
import { AttendanceSummaryService } from "./attendance-summary.service";

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly attendanceSummaryService: AttendanceSummaryService,
  ) {}

  /**
   * 1. LẤY DANH SÁCH ĐIỂM DANH
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
   * 2. LẤY CHI TIẾT 1 BẢN GHI
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

    const newRecord = await this.prisma.attendance.create({
      data: {
        studentId: dto.studentId,
        classSubjectId: dto.classSubjectId,
        scheduleDetailId: dto.scheduleDetailId,
        status: dto.status,
        note: dto.note,
        recordedById: userId,
      },
    });

    // Tính lại tổng hợp chuyên cần
    await this.attendanceSummaryService.recalculateSummary(dto.studentId, dto.classSubjectId);

    return newRecord;
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
    // Lấy danh sách điểm danh hiện tại để so sánh status thay đổi
    const existingAttendances = await this.prisma.attendance.findMany({
      where: {
        scheduleDetailId,
        studentId: { in: attendances.map((a) => a.studentId) },
      },
      select: { studentId: true, status: true },
    });

    const existingMap = new Map(existingAttendances.map((item) => [item.studentId, item.status]));

    // Lọc ra các sinh viên có sự THAY ĐỔI trạng thái hoặc MỚI được điểm danh
    const affectedStudentIds = attendances
      .filter((item) => {
        const currentStatus = existingMap.get(item.studentId);
        return currentStatus === undefined || currentStatus !== item.status;
      })
      .map((item) => item.studentId);

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

    // Thực thi transaction
    const result = await this.prisma.$transaction(operations);

    // Tính lại cho những sinh viên thực sự có thay đổi status
    if (affectedStudentIds.length > 0) {
      await Promise.all(
        affectedStudentIds.map((studentId) =>
          this.attendanceSummaryService.recalculateSummary(studentId, classSubjectId),
        ),
      );
    }

    return result;
  }

  /**
   * 5. CẬP NHẬT ĐIỂM DANH (Chỉ tính lại khi đổi status)
   */
  async update(id: number, dto: Partial<CreateAttendanceDto>, userId: number | null): Promise<AttendanceDto> {
    const oldRecord = await this.findOne(id);

    const updatedRecord = await this.prisma.attendance.update({
      where: { id },
      data: {
        ...dto,
        recordedById: userId,
        recordedAt: new Date(),
      },
    });

    // 🔄 Chỉ tính lại khi trạng thái (status) thay đổi
    if (dto.status && dto.status !== oldRecord.status) {
      await this.attendanceSummaryService.recalculateSummary(updatedRecord.studentId, updatedRecord.classSubjectId);
    }

    return updatedRecord;
  }

  /**
   * 6. XÓA BẢN GHI ĐIỂM DANH
   */
  async remove(id: number): Promise<{ message: string }> {
    const oldRecord = await this.findOne(id);

    await this.prisma.attendance.delete({
      where: { id },
    });

    // 🔄 Xóa điểm danh -> Tính lại tổng hợp chuyên cần
    await this.attendanceSummaryService.recalculateSummary(oldRecord.studentId, oldRecord.classSubjectId);

    return { message: `Xóa thành công bản ghi điểm danh #${id}` };
  }
}
