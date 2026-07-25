import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  CreateStudentExamDetailDto,
  SearchStudentExamDetailDto,
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
