import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  IsDateString,
  Min,
  IsEmail,
  IsBoolean,
} from "class-validator";
import { StudentStatus } from "../../prisma/generated/prisma/enums.js";
import { Student } from "../../prisma/generated/prisma/client.js";
import { Type } from "class-transformer";

export type StudentDto = Student;

export class CreateStudentDto {
  @ApiProperty({ example: "Nguyễn Văn A" })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiPropertyOptional({ example: "student@example.com" })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: true, description: "true: Nam, false: Nữ" })
  @IsBoolean()
  @IsOptional()
  gender?: boolean;

  @ApiPropertyOptional({ example: "2005-05-20" })
  @IsDateString()
  @IsOptional()
  dob?: Date;

  @ApiPropertyOptional({ example: "0987654321" })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: "123 Đường ABC, Nha Trang" })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: "056205001234" })
  @IsString()
  @IsOptional()
  identityNumber?: string;

  @ApiPropertyOptional({
    example: "Nguyễn Văn B",
    description: "Tên phụ huynh",
  })
  @IsString()
  @IsOptional()
  parentName?: string;

  @ApiPropertyOptional({ example: "0912345678" })
  @IsString()
  @IsOptional()
  parentPhone?: string;

  // --- THÔNG TIN ĐÀO TẠO (BỔ SUNG QUAN TRỌNG) ---

  @ApiProperty({ example: 1, description: "ID của Ngành học" })
  @IsInt()
  @IsNotEmpty()
  majorId: number;

  @ApiPropertyOptional({
    example: 1,
    description: "ID của Khóa đào tạo (K1, K2...)",
  })
  @IsInt()
  @IsOptional()
  batchId?: number;

  @ApiPropertyOptional({
    enum: StudentStatus,
    default: StudentStatus.pending,
  })
  @IsEnum(StudentStatus)
  @IsOptional()
  status?: StudentStatus = StudentStatus.pending;
}

export class UpdateStudentDto extends PartialType(CreateStudentDto) {
  // Thường không cho phép cập nhật lại userId hoặc studentCode sau khi đã tạo
  @ApiPropertyOptional()
  @IsOptional()
  classId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  enrollmentDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  graduationDate?: Date;
}

export class SearchStudentDto {
  // --- PHÂN TRANG ---
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  // --- LỌC & TÌM KIẾM ---
  @ApiPropertyOptional({ description: "Tìm kiếm theo mã SV, tên SV hoặc CCCD" })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ enum: StudentStatus })
  @IsOptional()
  @IsEnum(StudentStatus)
  status?: StudentStatus;

  @ApiPropertyOptional({ description: "Lọc theo ID lớp học" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  classId?: number;

  @ApiPropertyOptional({
    description: "Lọc theo ngày nhập học từ (YYYY-MM-DD)",
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    description: "Lọc theo ngày nhập học đến (YYYY-MM-DD)",
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  // --- SẮP XẾP ---
  @ApiPropertyOptional({ default: "createdAt" })
  @IsOptional()
  @IsString()
  sortBy?: string = "createdAt";

  @ApiPropertyOptional({ enum: ["asc", "desc"], default: "desc" })
  @IsOptional()
  @IsEnum(["asc", "desc"])
  sortOrder?: "asc" | "desc" = "desc";
}
