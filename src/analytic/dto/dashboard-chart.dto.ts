import { ApiProperty } from "@nestjs/swagger";

export class MonthDataPointDto {
  @ApiProperty({ description: "Tháng định dạng YYYY-MM", example: "2026-01" })
  month: string;

  @ApiProperty({ description: "Số lượng tích lũy/phát sinh trong tháng" })
  count: number;
}

export class GrowthChartsResponseDto {
  @ApiProperty({
    description: "Dữ liệu tăng trưởng nguồn học sinh đăng ký tư vấn",
    type: [MonthDataPointDto],
  })
  registerGrowth: MonthDataPointDto[];

  @ApiProperty({
    description: "Dữ liệu học sinh nhập học chính thức thành công",
    type: [MonthDataPointDto],
  })
  studyingGrowth: MonthDataPointDto[];
}

// --- DTO 1: Cho biểu đồ Tỷ trọng ngành học (Pie/Donut Chart) ---
export class MajorDistributionResponseDto {
  @ApiProperty({
    description: "Tên chuyên ngành đào tạo",
    example: "Công nghệ thông tin",
  })
  name: string;

  @ApiProperty({
    description: "Số lượng học viên đang theo học thực tế",
    example: 145,
  })
  value: number;
}

// --- DTO 2: Cho biểu đồ Phân tích Học lực theo Lớp (Stacked Bar Chart) ---
export class AcademicPerformanceResponseDto {
  @ApiProperty({ description: "Tên lớp học", example: "CNTT-K26A" })
  className: string;

  @ApiProperty({
    description: "Số lượng học sinh đạt Xuất sắc trong lớp",
    example: 5,
    required: false,
  })
  "Xuất sắc"?: number;

  @ApiProperty({
    description: "Số lượng học sinh đạt Giỏi trong lớp",
    example: 18,
    required: false,
  })
  "Giỏi"?: number;

  @ApiProperty({
    description: "Số lượng học sinh đạt Khá trong lớp",
    example: 12,
    required: false,
  })
  "Khá"?: number;

  @ApiProperty({
    description: "Số lượng học sinh đạt Trung bình trong lớp",
    example: 3,
    required: false,
  })
  "Trung bình"?: number;

  @ApiProperty({
    description: "Số lượng học sinh chưa được đánh giá",
    example: 1,
    required: false,
  })
  "Chưa xếp loại"?: number;
}
