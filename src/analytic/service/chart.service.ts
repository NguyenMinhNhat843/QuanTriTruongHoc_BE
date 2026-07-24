import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ChartService {
  constructor(private prisma: PrismaService) {}

  async getStudentGrowthCharts() {
    // 1. Lấy dữ liệu tăng trưởng học sinh ĐĂNG KÝ TƯ VẤN (status = 'register')
    const registerGrowth: { month: string; count: number }[] = await this.prisma.$queryRaw`
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
    const studyingGrowth: { month: string; count: number }[] = await this.prisma.$queryRaw`
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
    // Thực hiện Raw Query để gộp nhóm, tính toán fallback majorId và lấy luôn tên ngành
    const result = await this.prisma.$queryRaw<{ majorName: string; studentCount: number }[]>`
    SELECT 
      m."majorName" AS "majorName",
      COUNT(s.id)::int AS "studentCount"
    FROM students s
    LEFT JOIN batches b ON s."batchId" = b.id
    -- JOIN sang bảng majors dựa trên giá trị majorId sau khi đã fallback
    INNER JOIN majors m ON COALESCE(s."majorId", b."majorId") = m.id
    WHERE 
      s.status = 'studying'
      -- Đảm bảo học sinh có thông tin ngành trực tiếp hoặc thông qua khóa học
      AND (s."majorId" IS NOT NULL OR b."majorId" IS NOT NULL)
    GROUP BY m."majorName"
    ORDER BY "studentCount" DESC;
  `;

    // Map lại thành cấu trúc chuẩn [ { name: "Tên Ngành", value: Số lượng } ]
    return result.map((item) => ({
      name: item.majorName,
      value: item.studentCount,
    }));
  }

  async getAcademicPerformanceByClass() {
    const currentSemester = await this.prisma.semester.findFirst({
      where: { isCurrent: true },
    });

    if (!currentSemester) return [];

    const gradesData = await this.prisma.gradeStudent.findMany({
      where: {
        classSubject: {
          semesterId: currentSemester.id,
        },
      },
      select: {
        rating: true, // Lấy xếp loại (Xuất sắc, Giỏi, Khá...)
        classSubject: {
          select: {
            baseClass: {
              select: {
                className: true,
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
      const className = item.classSubject?.baseClass?.className;
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
