import { ApiProperty } from "@nestjs/swagger";

// --- DTO cho thống kê tổng quan ---
export class OverviewStatsResponseDto {
  @ApiProperty({ example: 150, description: "Tổng số học sinh hệ thống" })
  totalStudents: number;

  @ApiProperty({ example: 25, description: "Tổng số giáo viên" })
  totalTeachers: number;

  @ApiProperty({ example: 90, description: "Số học sinh đang học chính thức" })
  studyingStudents: number;

  @ApiProperty({ example: 15, description: "Số học sinh đang chờ xét tuyển" })
  pendingStudents: number;

  @ApiProperty({ example: 20, description: "Số học sinh mới đăng ký tư vấn" })
  registerStudents: number;
}

// --- Các object con trong mảng biểu đồ ---
class ChartPointDto {
  @ApiProperty({
    example: "2026-06",
    description: "Tháng thống kê (Định dạng YYYY-MM)",
  })
  month: string;

  @ApiProperty({ example: 12, description: "Số lượng học sinh" })
  count: number;
}

// --- DTO cho dữ liệu biểu đồ tăng trưởng ---
export class GrowthChartsResponseDto {
  @ApiProperty({
    type: [ChartPointDto],
    description: "Dữ liệu tăng trưởng học sinh đăng ký mới tư vấn",
  })
  registerGrowth: ChartPointDto[];

  @ApiProperty({
    type: [ChartPointDto],
    description: "Dữ liệu tăng trưởng học sinh nhập học thành công (đang học)",
  })
  studyingGrowth: ChartPointDto[];
}
