import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { CreateExamScheduleDto, SearchExamScheduleDto, UpdateExamScheduleDto } from "../dto/exam-schedule.dto";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ExamScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 1. Tạo Lịch/Đợt thi & TỰ ĐỘNG LỌC SINH VIÊN ĐỦ ĐIỀU KIỆN (Vắng <= 20%)
   */
  async create(dto: CreateExamScheduleDto) {
    const classSubject = await this.prisma.classSubject.findUnique({
      where: { id: dto.classSubjectId },
    });

    if (!classSubject) {
      throw new NotFoundException(`Không tìm thấy Lớp học phần với ID #${dto.classSubjectId}`);
    }

    // Chuyển đổi kiểu dữ liệu examDate nếu gửi dạng String
    const examDate = dto.examDate ? new Date(dto.examDate) : new Date();

    // Thực hiện Transaction: Tạo ExamSchedule + Tự động thêm StudentExamDetail
    return this.prisma.$transaction(async (tx) => {
      // Tạo bản ghi Lịch thi
      const examSchedule = await tx.examSchedule.create({
        data: {
          ...dto,
          examDate,
        },
      });

      // Lấy danh sách SV đủ điều kiện từ AttendanceSummary
      // Tiêu chí: ELIGIBLE HOẶC (Chưa chốt tay + vắng <= 20%)
      const eligibleSummaries = await tx.attendanceSummary.findMany({
        where: {
          classSubjectId: dto.classSubjectId,
          OR: [
            { examStatus: "ELIGIBLE" },
            {
              isManuallyLocked: false,
              absentPercentage: { lte: 20 }, // Vắng <= 20%
            },
          ],
        },
        select: {
          studentId: true,
        },
      });

      // Nếu có SV đủ điều kiện -> Tạo danh sách StudentExamDetail
      if (eligibleSummaries.length > 0) {
        const studentExamRecords = eligibleSummaries.map((summary) => ({
          examScheduleId: examSchedule.id,
          studentId: summary.studentId,
          isAttended: true,
          isViolated: false,
        }));

        await tx.studentExamDetail.createMany({
          data: studentExamRecords,
          skipDuplicates: true,
        });
      }

      // Trả về Lịch thi vừa tạo kèm danh sách SV dự thi
      return tx.examSchedule.findUnique({
        where: { id: examSchedule.id },
        include: {
          classSubject: {
            include: { subject: true },
          },
          room: true,
          studentExams: {
            include: { student: true },
          },
        },
      });
    });
  }

  /**
   * 2. Lấy danh sách Đợt thi (Có lọc & Phân trang)
   */
  async findAll(query: SearchExamScheduleDto & { page?: number; limit?: number }) {
    const { classSubjectId, examDate, examTurn, shift, roomId, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (classSubjectId) where.classSubjectId = Number(classSubjectId);
    if (examTurn) where.examTurn = Number(examTurn);
    if (shift) where.shift = shift;
    if (roomId) where.roomId = Number(roomId);
    if (examDate) {
      const date = new Date(examDate);
      where.examDate = {
        gte: new Date(date.setHours(0, 0, 0, 0)),
        lte: new Date(date.setHours(23, 59, 59, 999)),
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.examSchedule.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          classSubject: {
            include: { subject: true },
          },
          room: true,
          _count: {
            select: { studentExams: true }, // Đếm tổng số SV trong đợt thi này
          },
        },
        orderBy: { examDate: "desc" },
      }),
      this.prisma.examSchedule.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 3. Lấy chi tiết 1 Đợt thi (Kèm danh sách SV dự thi)
   */
  async findOne(id: number) {
    const examSchedule = await this.prisma.examSchedule.findUnique({
      where: { id },
      include: {
        classSubject: {
          include: {
            subject: true,
            baseClass: true,
          },
        },
        room: true,
        studentExams: {
          include: { student: true },
          orderBy: [
            { identificationNum: "asc" }, // Sắp xếp theo SBD nếu có
            { student: { studentCode: "asc" } },
          ],
        },
      },
    });

    if (!examSchedule) {
      throw new NotFoundException(`Không tìm thấy Lịch thi với ID #${id}`);
    }

    return examSchedule;
  }

  /**
   * 4. Cập nhật thông tin Lịch thi
   */
  async update(id: number, dto: UpdateExamScheduleDto) {
    await this.findOne(id);

    const dataToUpdate: any = { ...dto };
    if (dto.examDate) {
      dataToUpdate.examDate = new Date(dto.examDate);
    }

    return this.prisma.examSchedule.update({
      where: { id },
      data: dataToUpdate,
      include: {
        classSubject: { include: { subject: true } },
        room: true,
      },
    });
  }

  /**
   * 5. Xóa Đợt thi (Sẽ tự động xóa các StudentExamDetail liên quan nhờCascade)
   */
  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.examSchedule.delete({
      where: { id },
    });
  }

  /**
   * 💡 6. NGHIỆP VỤ BỔ SUNG: Thêm thủ công 1 Sinh viên vào Đợt thi
   */
  async addStudentToExam(examScheduleId: number, studentId: number) {
    const examSchedule = await this.prisma.examSchedule.findUnique({
      where: { id: examScheduleId },
    });

    if (!examSchedule) {
      throw new NotFoundException(`Không tìm thấy Lịch thi với ID #${examScheduleId}`);
    }

    // Kiểm tra xem sinh viên đã có trong danh sách thi chưa
    const existing = await this.prisma.studentExamDetail.findUnique({
      where: {
        examScheduleId_studentId: {
          examScheduleId,
          studentId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException("Sinh viên này đã có trong danh sách đợt thi!");
    }

    return this.prisma.studentExamDetail.create({
      data: {
        examScheduleId,
        studentId,
        isAttended: true,
        isViolated: false,
      },
      include: {
        student: true,
      },
    });
  }

  /**
   * 💡 7. NGHIỆP VỤ BỔ SUNG: Đồng bộ / Cập nhật lại danh sách thi theo điểm danh mới nhất
   * (Dùng khi sau khi chốt điểm danh muộn hoặc điều chỉnh cấm thi tay)
   */
  async syncStudentsFromAttendance(examScheduleId: number) {
    const examSchedule = await this.findOne(examScheduleId);

    // Lấy danh sách SV đủ điều kiện
    const eligibleSummaries = await this.prisma.attendanceSummary.findMany({
      where: {
        classSubjectId: examSchedule.classSubjectId,
        OR: [
          { examStatus: "ELIGIBLE" },
          {
            isManuallyLocked: false,
            absentPercentage: { lte: 20 },
          },
        ],
      },
      select: { studentId: true },
    });

    const studentIds = eligibleSummaries.map((s) => s.studentId);

    if (studentIds.length === 0) {
      return { message: "Không có sinh viên nào đủ điều kiện thi", addedCount: 0 };
    }

    const dataToInsert = studentIds.map((studentId) => ({
      examScheduleId,
      studentId,
      isAttended: true,
      isViolated: false,
    }));

    // Bỏ qua những SV đã có sẵn trong đợt thi
    const result = await this.prisma.studentExamDetail.createMany({
      data: dataToInsert,
      skipDuplicates: true,
    });

    return {
      message: `Đã đồng bộ thành công. Thêm mới ${result.count} sinh viên vào đợt thi.`,
      addedCount: result.count,
    };
  }
}
