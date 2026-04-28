import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDateString, IsInt, IsNotEmpty, IsOptional } from "class-validator";

// ==========================================
// XEM DANH SACH LỚP DỰ KIẾN: DTO để xem trước kế hoạch học tập của một học kỳ thực tế, ngành và khóa đào tạo cụ thể
// ==========================================
export class PreviewCourseOfferDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  semesterId: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  majorId: number;

  @ApiProperty({ example: 3 })
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  batchId: number;
}

export class CreateBulkCourseOfferDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  semesterId: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  majorId: number;

  @ApiProperty({ example: 3 })
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  batchId: number;

  @ApiPropertyOptional({
    example: "2026-05-01T00:00:00Z",
    description: "Ngày bắt đầu cho phép sinh viên đăng ký",
  })
  @IsDateString()
  @IsOptional()
  registrationStart?: string;

  @ApiPropertyOptional({
    example: "2026-05-15T23:59:59Z",
    description: "Ngày kết thúc đăng ký",
  })
  @IsDateString()
  @IsOptional()
  registrationEnd?: string;

  @ApiPropertyOptional({
    example: 50,
    description:
      "Số lượng sinh viên tối đa mặc định nếu lớp danh nghĩa không có dữ liệu",
  })
  @IsInt()
  @IsOptional()
  defaultMaxStudents?: number;
}
