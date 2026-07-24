import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ExamEligibilityStatus } from "../../../prisma/generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import {
  AttendanceSummaryDetailDto,
  AttendanceSummaryDto,
  CreateAttendanceSummaryDto,
  SearchAttendanceSummaryDto,
  UpdateAttendanceSummaryDto,
} from "../dto/attendance-summary.dto";

@Injectable()
export class AttendanceSummaryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 1. LẤY DANH SÁCH / TÌM KIẾM TỔNG HỢP CHUYÊN CẦN
   */
  async findAll(query?: SearchAttendanceSummaryDto): Promise<AttendanceSummaryDetailDto[]> {
    const where: any = {};

    if (query?.id) where.id = query.id;
    if (query?.studentId) where.studentId = query.studentId;
    if (query?.classSubjectId) where.classSubjectId = query.classSubjectId;

    return this.prisma.attendanceSummary.findMany({
      where,
      include: {
        student: true,
        classSubject: true,
      },
      orderBy: { studentId: "asc" },
    });
  }

  /**
   * 2. LẤY CHI TIẾT 1 BẢN GHI
   */
  async findOne(id: number): Promise<AttendanceSummaryDetailDto> {
    const summary = await this.prisma.attendanceSummary.findUnique({
      where: { id },
      include: {
        student: true,
        classSubject: true,
      },
    });

    if (!summary) {
      throw new NotFoundException(`Không tìm thấy bản ghi tổng hợp chuyên cần #${id}`);
    }

    return summary;
  }

  /**
   * 3. TẠO MỚI TỔNG HỢP CHUYÊN CẦN
   */
  async create(dto: CreateAttendanceSummaryDto): Promise<AttendanceSummaryDto> {
    const existing = await this.prisma.attendanceSummary.findUnique({
      where: {
        studentId_classSubjectId: {
          studentId: dto.studentId,
          classSubjectId: dto.classSubjectId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException("Bản ghi tổng hợp chuyên cần cho sinh viên trong lớp học phần này đã tồn tại!");
    }

    return this.prisma.attendanceSummary.create({
      data: dto,
    });
  }

  /**
   * 4. CẬP NHẬT (Ví dụ: Admin/Phòng đào tạo khóa tay hoặc đổi trạng thái thi)
   */
  async update(id: number, dto: UpdateAttendanceSummaryDto): Promise<AttendanceSummaryDto> {
    await this.findOne(id);

    return this.prisma.attendanceSummary.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * 5. XÓA BẢN GHI TỔNG HỢP
   */
  async remove(id: number): Promise<{ message: string }> {
    await this.findOne(id);

    await this.prisma.attendanceSummary.delete({
      where: { id },
    });

    return { message: `Xóa thành công bản ghi tổng hợp chuyên cần #${id}` };
  }

  /**
   * 6. HÀM TỰ ĐỘNG TÍNH LẠI TỔNG HỢP CHUYÊN CẦN & ĐIỀU KIỆN THI
   * Được gọi sau khi giáo viên điểm danh/sửa điểm danh buổi học
   */
  async recalculateSummary(
    studentId: number,
    classSubjectId: number,
    allowThresholdPercent: number = 20, // Ngưỡng vắng tối đa cho phép (mặc định 20%)
  ): Promise<AttendanceSummaryDto> {
    // A. Lấy tất cả các bản ghi điểm danh của SV trong Lớp HP này
    const records = await this.prisma.attendance.findMany({
      where: {
        studentId,
        classSubjectId,
      },
      include: {
        scheduleDetail: {
          include: {
            session: true, // Lấy countPeriod (Số tiết của buổi)
          },
        },
      },
    });

    // B. Tính toán tổng số tiết đã diễn ra và số tiết vắng
    let totalPeriods = 0;
    let totalAbsentPeriods = 0;

    for (const record of records) {
      const sessionPeriods = record.scheduleDetail?.session?.countPeriod || 2;
      totalPeriods += sessionPeriods;

      // Cứ trạng thái không phải PRESENT (ví dụ ABSENT, LATE...) thì tính vắng
      if (record.status !== "PRESENT") {
        totalAbsentPeriods += sessionPeriods;
      }
    }

    const absentPercentage = totalPeriods > 0 ? Number(((totalAbsentPeriods / totalPeriods) * 100).toFixed(2)) : 0;

    // C. Kiểm tra bản ghi summary hiện tại
    const currentSummary = await this.prisma.attendanceSummary.findUnique({
      where: {
        studentId_classSubjectId: {
          studentId,
          classSubjectId,
        },
      },
    });

    // Nếu đã bị khóa bằng tay (isManuallyLocked), giữ nguyên examStatus chỉ định
    let examStatus: ExamEligibilityStatus;
    if (currentSummary?.isManuallyLocked) {
      examStatus = currentSummary.examStatus;
    } else {
      examStatus =
        absentPercentage >= allowThresholdPercent ? ExamEligibilityStatus.INELIGIBLE : ExamEligibilityStatus.ELIGIBLE;
    }

    // D. Upsert bản ghi tổng hợp
    return this.prisma.attendanceSummary.upsert({
      where: {
        studentId_classSubjectId: {
          studentId,
          classSubjectId,
        },
      },
      update: {
        totalPeriods,
        totalAbsentPeriods,
        absentPercentage,
        examStatus,
      },
      create: {
        studentId,
        classSubjectId,
        totalPeriods,
        totalAbsentPeriods,
        absentPercentage,
        examStatus,
      },
    });
  }
}
