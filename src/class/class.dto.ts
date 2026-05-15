import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  MaxLength,
  Min,
  Max,
  IsNumber,
} from "class-validator";
import { PartialType } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class CreateClassDto {
  @ApiProperty({ example: "CNTT17A", description: "Mã lớp học duy nhất" })
  @IsString()
  @IsNotEmpty({ message: "Mã lớp không được để trống" })
  @MaxLength(20)
  classCode: string;

  @ApiProperty({ example: "Lớp Công nghệ thông tin 17A" })
  @IsString()
  @IsNotEmpty({ message: "Tên lớp không được để trống" })
  @MaxLength(255)
  className: string;

  @ApiProperty({ example: 1, description: "ID của ngành đào tạo" })
  @IsInt()
  @IsNotEmpty()
  majorId: number;

  @ApiProperty({ example: 2024, description: "Năm nhập học/Khóa" })
  @IsInt()
  @Min(2000)
  @IsNotEmpty()
  courseYear: number;

  @ApiPropertyOptional({
    example: 1,
    description: "ID của giáo viên chủ nhiệm",
  })
  @IsInt()
  @IsOptional()
  formTeacherId?: number;

  @ApiPropertyOptional({ example: 40, default: 40 })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxStudents?: number;

  @ApiPropertyOptional({ example: "active", default: "active" })
  @IsString()
  @IsOptional()
  status?: string;
}

export class UpdateClassDto extends PartialType(CreateClassDto) {}

export class AssignClassDto {
  @ApiProperty({
    example: 1,
    description: "ID của Ngành cần phân lớp",
  })
  @IsInt()
  @IsNotEmpty()
  majorId: number;

  @ApiProperty({
    example: 1,
    description: "ID của Khóa đào tạo cần phân lớp",
  })
  @IsInt()
  @IsNotEmpty()
  batchId: number;

  @ApiPropertyOptional({
    example: 30,
    description: "Số lượng sinh viên tối đa trong một lớp",
    default: 40,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  maxStudents?: number = 40;
}

class StudentSimpleDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "SV2026001" })
  studentCode: string;

  @ApiProperty({ example: "Nguyễn Văn A" })
  fullName: string;

  @ApiProperty({ example: "Tuyển sinh Đợt 1 - 2026" })
  admissionName: string;
}

export class EligibleStudentsResponseDto {
  @ApiProperty({ example: 150 })
  totalEligible: number;

  @ApiProperty({ type: [StudentSimpleDto] })
  students: StudentSimpleDto[];
}

export class RequestEligibleStudents {
  @ApiProperty({
    example: 1,
    description: "ID của Khóa đào tạo cần phân lớp",
    type: Number,
    required: false, // Thêm cái này để Swagger hiểu là không bắt buộc
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "batchId phải là số!" })
  batchId?: number;
}

export class AssignStudentsToClassesDto {
  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  batchId?: number;

  @ApiPropertyOptional({ type: Number, default: 40 })
  @IsOptional()
  studentsPerClass?: number;
}
