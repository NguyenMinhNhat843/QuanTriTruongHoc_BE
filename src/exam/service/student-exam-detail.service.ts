import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  CreateStudentExamDetailDto,
  SearchStudentExamDetailDto,
  UpdateAttendanceDto,
  UpdateBulkExamScoreDto,
  UpdateStudentExamDetailDto,
} from "../dto/student-exam-detail.dto";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class StudentExamDetailService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 1. Thêm mới sinh viên vào danh sách phòng thi
   */
  async create(dto: CreateStudentExamDetailDto) {
    // Kiểm tra xem Sinh viên đã được thêm vào Lịch thi này chưa (tránh trùng lặp)
    const existing = await this.prisma.studentExamDetail.findUnique({
      where: {
        examScheduleId_studentId: {
          examScheduleId: dto.examScheduleId,
          studentId: dto.studentId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException("Sinh viên này đã có trong danh sách phòng thi này!");
    }

    return this.prisma.studentExamDetail.create({
      data: dto,
      include: {
        student: true, // Trả về kèm thông tin sinh viên
      },
    });
  }

  /**
   * 2. Lấy danh sách (Có tìm kiếm theo examScheduleId, studentId & Phân trang)
   */
  async findAll(query: SearchStudentExamDetailDto & { page?: number; limit?: number }) {
    const { examScheduleId, studentId, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (examScheduleId) {
      where.examScheduleId = Number(examScheduleId);
    }

    if (studentId) {
      where.studentId = Number(studentId);
    }

    const [data, total] = await Promise.all([
      this.prisma.studentExamDetail.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          student: true, // Joint thông tin sinh viên để hiển thị lên bảng danh sách
        },
        orderBy: {
          identificationNum: "asc", // Sắp xếp theo Số báo danh (SBD)
        },
      }),
      this.prisma.studentExamDetail.count({ where }),
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
   * 3. Lấy chi tiết 1 bản ghi theo ID
   */
  async findOne(id: number) {
    const item = await this.prisma.studentExamDetail.findUnique({
      where: { id },
      include: {
        student: true,
        examSchedule: {
          include: {
            classSubject: {
              include: {
                subject: true,
              },
            },
            room: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException(`Không tìm thấy dữ liệu điểm thi với ID #${id}`);
    }

    return item;
  }

  /**
   * 4. Cập nhật thông tin (Điểm danh, Số báo danh, Số ghế, Vi phạm quy chế)
   */
  async update(id: number, dto: UpdateStudentExamDetailDto) {
    await this.findOne(id); // Kiểm tra tồn tại trước khi update

    return this.prisma.studentExamDetail.update({
      where: { id },
      data: dto,
      include: {
        student: true,
      },
    });
  }

  /**
   * Cập nhật trạng thái điểm danh cho danh sách sinh viên trong phòng thi
   */
  async updateAttendance(dto: UpdateAttendanceDto) {
    const { attendances } = dto;

    if (!attendances || attendances.length === 0) {
      return { message: "Không có dữ liệu điểm danh nào được gửi lên" };
    }

    const detailIds = attendances.map((item) => item.studentExamDetailId);

    // 1. Kiểm tra xem tất cả ID gửi lên có tồn tại trong DB không
    const existingDetails = await this.prisma.studentExamDetail.findMany({
      where: { id: { in: detailIds } },
      select: { id: true },
    });

    if (existingDetails.length !== detailIds.length) {
      throw new NotFoundException("Một số bản ghi chi tiết danh sách thi không tồn tại trên hệ thống");
    }

    // 2. Chạy transaction cập nhật trạng thái điểm danh
    await this.prisma.$transaction(async (tx) => {
      const updatePromises: Promise<unknown>[] = attendances.map((item) =>
        tx.studentExamDetail.update({
          where: { id: item.studentExamDetailId },
          data: { isAttended: item.isAttended },
        }),
      );

      await Promise.all(updatePromises);
    });

    return {
      success: true,
      message: `Đã cập nhật trạng thái điểm danh cho ${attendances.length} sinh viên`,
      count: attendances.length,
    };
  }

  /**
   * Cập nhật điểm thi hàng loạt dựa theo đợt thi (examTurn) của lịch thi
   */
  async updateBulkExamScores(dto: UpdateBulkExamScoreDto) {
    const { scores } = dto;

    if (!scores || scores.length === 0) {
      throw new BadRequestException("Danh sách điểm thi không được để rỗng");
    }

    for (const item of scores) {
      if (item.examScore < 0 || item.examScore > 10) {
        throw new BadRequestException(
          `Điểm không hợp lệ (${item.examScore}) tại bản ghi ID ${item.studentExamDetailId}`,
        );
      }
    }

    const detailIds = scores.map((s) => s.studentExamDetailId);

    return await this.prisma.$transaction(async (tx) => {
      // 1. Lấy danh sách dự thi kèm trạng thái điểm danh & thông tin Lịch thi
      const examDetails = await tx.studentExamDetail.findMany({
        where: { id: { in: detailIds } },
        select: {
          id: true,
          studentId: true,
          isAttended: true, // <--- Lấy thêm trạng thái điểm danh
          student: {
            select: {
              fullName: true, // Lấy tên để thông báo lỗi rõ ràng nếu muốn
            },
          },
          examSchedule: {
            select: {
              classSubjectId: true,
              examTurn: true,
            },
          },
        },
      });

      if (examDetails.length !== scores.length) {
        throw new NotFoundException("Có một số bản ghi chi tiết phòng thi không tồn tại trong hệ thống");
      }

      // 2. Validate điểm danh & examTurn
      for (const detail of examDetails) {
        // Kiểm tra trạng thái điểm danh
        if (!detail.isAttended) {
          throw new BadRequestException(
            `Học sinh ${detail.student?.fullName || ""} (ID: ${detail.id}) chưa được điểm danh nên không thể nhập điểm thi.`,
          );
        }

        // Kiểm tra lượt thi
        const turn = detail.examSchedule.examTurn;
        if (turn !== 1 && turn !== 2) {
          throw new BadRequestException(
            `Lịch thi đang ở lượt thi thứ ${turn}. Hệ thống chỉ hỗ trợ đồng bộ điểm cho Lần 1 và Lần 2.`,
          );
        }
      }

      // Map tra cứu nhanh
      const detailMap = new Map(examDetails.map((d) => [d.id, d]));

      const updatePromises: Promise<unknown>[] = [];

      for (const item of scores) {
        const detailInfo = detailMap.get(item.studentExamDetailId)!;
        const studentId = detailInfo.studentId;
        const classSubjectId = detailInfo.examSchedule.classSubjectId;
        const examTurn = detailInfo.examSchedule.examTurn;

        const scoreFieldToUpdate = examTurn === 1 ? "diemKiemTra1" : "diemKiemTra2";

        // Update bảng StudentExamDetail
        updatePromises.push(
          tx.studentExamDetail.update({
            where: { id: item.studentExamDetailId },
            data: { examScore: item.examScore },
          }),
        );

        // Đồng bộ sang bảng GradeStudent (Upsert)
        updatePromises.push(
          tx.gradeStudent.upsert({
            where: {
              studentId_classSubjectId: {
                studentId,
                classSubjectId,
              },
            },
            update: {
              [scoreFieldToUpdate]: item.examScore,
            },
            create: {
              studentId,
              classSubjectId,
              [scoreFieldToUpdate]: item.examScore,
            },
          }),
        );
      }

      await Promise.all(updatePromises);

      return {
        success: true,
        message: `Đã cập nhật thành công điểm thi cho ${scores.length} học sinh`,
        count: scores.length,
      };
    });
  }

  /**
   * 5. Xóa sinh viên khỏi phòng thi
   */
  async remove(id: number) {
    await this.findOne(id); // Kiểm tra tồn tại

    return this.prisma.studentExamDetail.delete({
      where: { id },
    });
  }

  /**
   * 💡 HÀM BỔ SUNG: Thêm hàng loạt Sinh viên vào phòng thi (Thường dùng khi Phòng đào tạo xếp danh sách thi)
   */
  async createMany(examScheduleId: number, studentIds: number[]) {
    const dataToInsert = studentIds.map((studentId) => ({
      examScheduleId,
      studentId,
      isAttended: true,
      isViolated: false,
    }));

    // skipDuplicates: true giúp bỏ qua những SV đã có trong danh sách
    return this.prisma.studentExamDetail.createMany({
      data: dataToInsert,
      skipDuplicates: true,
    });
  }
}
