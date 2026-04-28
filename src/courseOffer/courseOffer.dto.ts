import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

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

// Tạo lớp học phần tùy chọn
export class CreateOptionalCourseOfferDto {
  @ApiProperty({ example: 1, description: "ID học kỳ muốn mở lớp" })
  @IsInt()
  @IsNotEmpty()
  semesterId: number;

  @ApiProperty({ example: 10, description: "ID môn học" })
  @IsInt()
  @IsNotEmpty()
  subjectId: number;

  @ApiPropertyOptional({
    example: 5,
    description: "ID lớp danh nghĩa nòng cốt (nếu có)",
  })
  @IsInt()
  @IsOptional()
  classId?: number;

  @ApiProperty({
    example: "Lớp học lại Chính trị kinh tế - K18",
    description: "Tên hiển thị của lớp",
  })
  @IsString()
  @IsNotEmpty()
  courseName: string;

  @ApiProperty({ example: 50, description: "Sĩ số tối đa" })
  @IsInt()
  @Min(1)
  maxStudents: number;

  @ApiPropertyOptional({ example: "2026-05-01T00:00:00Z" })
  @IsDateString()
  @IsOptional()
  registrationStart?: string;

  @ApiPropertyOptional({ example: "2026-05-15T23:59:59Z" })
  @IsDateString()
  @IsOptional()
  registrationEnd?: string;
}
