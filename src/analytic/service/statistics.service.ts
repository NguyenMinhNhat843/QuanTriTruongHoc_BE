import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class StatisticsService {
  constructor(private prisma: PrismaService) {}

  async getOverviewStats() {
    // Sử dụng Promise.all để tối ưu hóa hiệu năng, chạy song song các câu lệnh đếm
    const [
      totalStudents,
      totalTeachers,
      studyingStudents,
      pendingStudents,
      registerStudents,
    ] = await Promise.all([
      // 1. Tổng số học sinh (tất cả trạng thái)
      this.prisma.student.count(),

      // 2. Tổng số giáo viên (Staff có EmployeeRole = TEACHER)
      this.prisma.staff.count({
        where: {
          EmployeeRole: "TEACHER",
        },
      }),

      // 3. Số học sinh đang học
      this.prisma.student.count({
        where: { status: "studying" },
      }),

      // 4. Số học sinh đang đợi xét tuyển
      this.prisma.student.count({
        where: { status: "pending" },
      }),

      // 5. Số học sinh đăng ký mới (tư vấn)
      this.prisma.student.count({
        where: { status: "registered" },
      }),
    ]);

    return {
      totalStudents,
      totalTeachers,
      studyingStudents,
      pendingStudents,
      registerStudents,
    };
  }
}
