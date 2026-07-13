import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ChartService {
  constructor(private prisma: PrismaService) {}

  async getStudentGrowthCharts() {
    // 1. Lấy dữ liệu tăng trưởng học sinh ĐĂNG KÝ TƯ VẤN (status = 'register')
    const registerGrowth: { month: string; count: number }[] = await this.prisma
      .$queryRaw`
      SELECT 
        TO_CHAR("createdAt", 'YYYY-MM') AS "month",
        COUNT(id)::int AS "count"
      FROM "students"
      WHERE "status" = 'registered'
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
      ORDER BY "month" ASC;
    `;

    // 2. Lấy dữ liệu tăng trưởng học sinh NHẬP HỌC THÀNH CÔNG (status = 'studying')
    // Note: Nếu bạn muốn chuẩn xác tính theo ngày họ bắt đầu học, có thể đổi "createdAt" thành "enrollmentDate"
    const studyingGrowth: { month: string; count: number }[] = await this.prisma
      .$queryRaw`
      SELECT 
        TO_CHAR("createdAt", 'YYYY-MM') AS "month",
        COUNT(id)::int AS "count"
      FROM "students"
      WHERE "status" = 'studying'
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
      ORDER BY "month" ASC;
    `;

    return {
      registerGrowth, // Trả về mảng dạng: [{ month: '2026-01', count: 15 }, { month: '2026-02', count: 32 }]
      studyingGrowth, // Trả về mảng dạng tương tự cho học sinh đang học
    };
  }

  async getMajorDistribution() {
    // Đếm số lượng học sinh đang học (status: 'studying') gom nhóm theo ngành/khối (Major)
    const distribution = await this.prisma.student.groupBy({
      by: ["majorId"],
      where: {
        status: "studying",
        majorId: { not: null }, // Bỏ qua nếu học sinh chưa phân ngành
      },
      _count: {
        id: true,
      },
    });

    // Lấy tên ngành tương ứng để Frontend hiển thị label
    const majorIds = distribution
      .map((d) => d.majorId)
      .filter((id): id is number => id !== null);
    const majors = await this.prisma.major.findMany({
      where: { id: { in: majorIds } },
      select: { id: true, majorName: true },
    });

    // Map lại thành cấu trúc chuẩn [ { name: "Tên Ngành", value: Số lượng } ]
    return distribution.map((item) => {
      const major = majors.find((m) => m.id === item.majorId);
      return {
        name: major?.majorName || "Ngành khác",
        value: item._count.id,
      };
    });
  }

  async getAcademicPerformanceByClass() {
    // 1. Tìm học kỳ hiện tại
    const currentSemester = await this.prisma.semester.findFirst({
      where: { isCurrent: true },
    });

    if (!currentSemester) return [];

    // 2. Đi xuyên qua quan hệ courseOffer để lọc điểm thuộc học kỳ này
    const gradesData = await this.prisma.gradeStudent.findMany({
      where: {
        courseOffer: {
          semesterId: currentSemester.id, // Lọc theo semesterId nằm trong bảng CourseOffer
        },
      },
      select: {
        rating: true, // Lấy xếp loại (Xuất sắc, Giỏi, Khá...)
        courseOffer: {
          select: {
            baseClass: {
              select: {
                className: true, // Lấy tên lớp gốc (ví dụ: CNTT-K26A) từ bảng Class
              },
            },
          },
        },
      },
    });

    // 3. Gom dữ liệu theo cấu trúc Stacked Bar Chart của Recharts
    const classMap: Record<string, any> = {};

    gradesData.forEach((item) => {
      // Kiểm tra xem bản ghi có gắn với lớp học nào không (phòng trường hợp baseClass bị null)
      const className = item.courseOffer?.baseClass?.className;
      if (!className) return;

      const rate = item.rating || "Chưa xếp loại";

      // Nếu lớp này chưa có trong map thì khởi tạo
      if (!classMap[className]) {
        classMap[className] = { className: className };
      }

      // Tăng số lượng của xếp loại tương ứng trong lớp đó lên 1
      classMap[className][rate] = (classMap[className][rate] || 0) + 1;
    });

    // Trả về mảng các Object sạch sẽ cho Frontend: [ { className: 'Lớp A', 'Giỏi': 10, 'Khá': 5 }, ... ]
    return Object.values(classMap);
  }
}
