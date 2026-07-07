import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from "@nestjs/swagger";
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
  IsNumber,
} from "class-validator";
import { StudentStatus } from "../../../prisma/generated/prisma/enums.js";
import { Student } from "../../../prisma/generated/prisma/client.js";
import { Exclude, Transform, Type } from "class-transformer";
import { CreateAdmissionProfileDto } from "../../admission-profile/dto/admission-profile.dto.js";

export class StudentDto implements Student {
  @ApiPropertyOptional({
    type: Number,
  })
  @IsInt()
  @IsOptional()
  id: number;

  @ApiPropertyOptional({
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  studentCode: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
  })
  @IsDateString()
  @IsOptional()
  enrollmentDate: Date | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
  })
  @IsDateString()
  @IsOptional()
  graduationDate: Date | null;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
  })
  @IsInt()
  @IsOptional()
  applicationId: number | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  avatarUrl: string | null;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
  })
  @IsInt()
  @IsOptional()
  userId: number | null;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsDateString()
  @Exclude()
  createdAt: Date;

  @ApiPropertyOptional({
    type: String,
  })
  @IsDateString()
  @IsOptional()
  @Exclude()
  updatedAt: Date;

  // --- THÔNG TIN CÁ NHÂN BẮT BUỘC ---
  @ApiProperty({
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  // --- THÔNG TIN CÁ NHÂN TÙY CHỌN (NULLABLE) ---
  @ApiPropertyOptional({
    type: String,
    nullable: true,
  })
  @IsEmail()
  @IsOptional()
  email: string | null;

  @ApiPropertyOptional({
    type: Boolean,
    nullable: true,
  })
  @IsBoolean()
  @IsOptional()
  gender: boolean | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsDateString()
  @IsOptional()
  dob: Date | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsString()
  @IsOptional()
  phone: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  address: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  identityNumber: string | null;

  // --- THÔNG TIN GIA ĐÌNH ---
  @ApiPropertyOptional({
    type: String,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  fatherName: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsString()
  @IsOptional()
  fatherPhone: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  fatherCCCD: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsInt()
  @IsOptional()
  fatherYearOfBirth: number | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsString()
  @IsOptional()
  fatherJob: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsString()
  @IsOptional()
  motherName: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsString()
  @IsOptional()
  motherPhone: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  motherCCCD: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsInt()
  @IsOptional()
  motherYearOfBirth: number | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsString()
  @IsOptional()
  motherJob: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  guardianName: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsString()
  @IsOptional()
  guardianRelationship: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsString()
  @IsOptional()
  guardianPhone: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  guardianCCCD: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsInt()
  @IsOptional()
  guardianYearOfBirth: number | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsString()
  @IsOptional()
  guardianJob: string | null;

  // --- THÔNG TIN ĐÀO TẠO ---
  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsInt()
  @IsOptional()
  batchId: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsInt()
  @IsOptional()
  classId: number | null;

  @ApiPropertyOptional({
    enum: StudentStatus,
    type: String,
  })
  @IsEnum(StudentStatus)
  @IsOptional()
  status: StudentStatus;
}

export class CreateStudentDto extends StudentDto {
  @ApiProperty({ type: CreateAdmissionProfileDto })
  @Type(() => CreateAdmissionProfileDto)
  @IsNotEmpty()
  admissionProfile: CreateAdmissionProfileDto;
}
export class UpdateStudentDto extends PartialType(
  OmitType(StudentDto, ["id", "createdAt", "updatedAt"]),
) {}

// Cho các học sinh này đậu xét tuyển
export class ApprovedStudentDto {
  @ApiProperty({ type: Number, required: false })
  @IsNumber()
  @IsOptional()
  quote?: number;
}

export class SearchStudentDto {
  // --- PHÂN TRANG ---
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  // --- LỌC & TÌM KIẾM ---
  @ApiPropertyOptional({ description: "Tìm kiếm theo mã SV, tên SV hoặc CCCD" })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ enum: StudentStatus, enumName: "StudentStatus" })
  @IsOptional()
  @IsEnum(StudentStatus)
  status?: StudentStatus;

  @ApiPropertyOptional({
    description:
      "nếu true: Lọc theo fiel status, nếu false: lọc theo không phải status",
  })
  @IsOptional()
  @Transform(
    ({ value }) =>
      value === "true" || value === true || value === 1 || value === "1",
  )
  @IsBoolean()
  excludeStatus?: boolean;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  classId?: number | null;

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

  @ApiPropertyOptional({ type: Number })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  majorId?: number;

  @ApiPropertyOptional({ type: Number })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  batchId?: number;

  // --- SẮP XẾP ---
  @ApiPropertyOptional({ default: "createdAt" })
  @IsOptional()
  @IsString()
  sortBy?: string = "createdAt";

  @ApiPropertyOptional({ description: "Tìm kiếm theo mã sinh viên" })
  @IsOptional()
  @IsString()
  studentCode?: string; // Thêm trường studentCode để hỗ trợ tìm kiếm theo mã sinh viên

  @ApiPropertyOptional({ enum: ["asc", "desc"], default: "desc" })
  @IsOptional()
  @IsEnum(["asc", "desc"], { each: true })
  sortOrder?: "asc" | "desc" = "desc";
}
