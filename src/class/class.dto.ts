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
import { Transform, Type } from "class-transformer";
import { Class } from "../../prisma/generated/prisma/client";

export class SearchClassDto {
  @ApiPropertyOptional({ description: "Mã lớp học (classCode)" })
  @IsOptional()
  @IsString()
  classCode?: string;

  @ApiPropertyOptional({ description: "ID ngành học" })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  majorId?: number;
}

export class CreateClassDto implements Omit<
  Class,
  "id" | "createdAt" | "updatedAt"
> {
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

  @ApiPropertyOptional({
    type: Number,
    description: "Số lượng sinh viên hiện tại trong lớp",
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  currentSize: number = 0;

  @ApiPropertyOptional({
    type: Number,
    description: "ID giáo viên chủ nhiệm",
  })
  @IsInt()
  @IsOptional()
  formTeacherId: number | null;

  @ApiPropertyOptional({
    type: Number,
    description: "ID của Khóa đào tạo (batchID)",
  })
  @IsInt()
  @IsOptional()
  batchId: number | null;

  @ApiPropertyOptional({ type: Number, example: 40, default: 40 })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxStudents: number = 40;

  @ApiPropertyOptional({ type: String, default: "active" })
  @IsString()
  @IsOptional()
  status: string = "active";
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
