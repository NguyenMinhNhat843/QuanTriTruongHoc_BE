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
}
