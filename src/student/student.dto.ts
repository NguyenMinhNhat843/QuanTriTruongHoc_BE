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
import { Exclude, Type } from "class-transformer";

export type StudentDto = Student;

export class CreateStudentDto implements Student {
  // --- THÔNG TIN HỆ THỐNG / HÀNH CHÍNH (BỔ SUNG MỚI) ---
  @ApiProperty({
    type: Number,
    example: 1,
    description:
      "ID tự tăng của học sinh (Nếu tạo mới có thể bỏ qua hoặc truyền 0 tùy logic backend)",
  })
  @IsInt()
  id: number;

  @ApiProperty({
    type: String,
    example: "HS20260001",
    description: "Mã số học sinh duy nhất",
  })
  @IsString()
  @IsNotEmpty()
  studentCode: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: "2026-09-05",
    description: "Ngày nhập học (Định dạng YYYY-MM-DD)",
  })
  @IsDateString()
  @IsOptional()
  enrollmentDate: Date | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: "2029-06-15",
    description: "Ngày tốt nghiệp dự kiến/thực tế (Định dạng YYYY-MM-DD)",
  })
  @IsDateString()
  @IsOptional()
  graduationDate: Date | null;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    example: 42,
    description: "ID Hồ sơ tuyển sinh liên kết",
  })
  @IsInt()
  @IsOptional()
  applicationId: number | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: "https://storage.googleapis.com/bucket/avatar.jpg",
    description: "Đường dẫn ảnh đại diện học sinh",
  })
  @IsString()
  @IsOptional()
  avatarUrl: string | null;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    example: 102,
    description: "ID tài khoản liên kết trong bảng User",
  })
  @IsInt()
  @IsOptional()
  userId: number | null;

  @ApiPropertyOptional({
    type: String,
    example: "2026-05-22T07:10:00.000Z",
    description: "Thời gian khởi tạo bản ghi",
  })
  @IsOptional()
  @IsDateString()
  @Exclude()
  createdAt: Date;

  @ApiPropertyOptional({
    type: String,
    example: "2026-05-22T07:10:00.000Z",
    description: "Thời gian cập nhật bản ghi gần nhất",
  })
  @IsDateString()
  @IsOptional()
  @Exclude()
  updatedAt: Date;

  // --- THÔNG TIN CÁ NHÂN BẮT BUỘC ---
  @ApiProperty({
    type: String,
    example: "Nguyễn Văn A",
    description: "Họ và tên đầy đủ của học sinh",
  })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  // --- THÔNG TIN CÁ NHÂN TÙY CHỌN (NULLABLE) ---
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: "nguyenvana@gmail.com",
  })
  @IsEmail()
  @IsOptional()
  email: string | null;

  @ApiPropertyOptional({
    type: Boolean,
    nullable: true,
    example: true,
    description: "true: Nam, false: Nữ",
  })
  @IsBoolean()
  @IsOptional()
  gender: boolean | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: "2008-05-20" })
  @IsDateString()
  @IsOptional()
  dob: Date | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: "0987654321" })
  @IsString()
  @IsOptional()
  phone: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: "123 Đường ABC, Nha Trang",
  })
  @IsString()
  @IsOptional()
  address: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: "056205001234",
  })
  @IsString()
  @IsOptional()
  identityNumber: string | null;

  // --- THÔNG TIN GIA ĐÌNH ---
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: "Nguyễn Văn B",
  })
  @IsString()
  @IsOptional()
  fatherName: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: "0912345678" })
  @IsString()
  @IsOptional()
  fatherPhone: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: "056201001234",
  })
  @IsString()
  @IsOptional()
  fatherCCCD: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true, example: 1975 })
  @IsInt()
  @IsOptional()
  fatherYearOfBirth: number | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: "Kỹ sư" })
  @IsString()
  @IsOptional()
  fatherJob: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: "Trần Thị C" })
  @IsString()
  @IsOptional()
  motherName: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: "0923456789" })
  @IsString()
  @IsOptional()
  motherPhone: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: "056202001234",
  })
  @IsString()
  @IsOptional()
  motherCCCD: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true, example: 1978 })
  @IsInt()
  @IsOptional()
  motherYearOfBirth: number | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: "Giáo viên" })
  @IsString()
  @IsOptional()
  motherJob: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: "Nguyễn Văn D",
  })
  @IsString()
  @IsOptional()
  guardianName: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: "Ông nội" })
  @IsString()
  @IsOptional()
  guardianRelationship: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: "0934567890" })
  @IsString()
  @IsOptional()
  guardianPhone: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: "056200001234",
  })
  @IsString()
  @IsOptional()
  guardianCCCD: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true, example: 1950 })
  @IsInt()
  @IsOptional()
  guardianYearOfBirth: number | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: "Hưu trí" })
  @IsString()
  @IsOptional()
  guardianJob: string | null;

  // --- THÔNG TIN ĐÀO TẠO ---
  @ApiPropertyOptional({ type: Number, nullable: true, example: 1 })
  @IsInt()
  @IsOptional()
  batchId: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true, example: 3 })
  @IsInt()
  @IsOptional()
  classId: number | null;

  @ApiPropertyOptional({
    enum: StudentStatus,
    type: String,
    default: StudentStatus.approved,
  })
  @IsEnum(StudentStatus)
  @IsOptional()
  status: StudentStatus;
}

export class UpdateStudentDto extends PartialType(CreateStudentDto) {}

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

  @ApiPropertyOptional({ description: "Tìm kiếm theo mã sinh viên" })
  @IsOptional()
  @IsString()
  studentCode?: string; // Thêm trường studentCode để hỗ trợ tìm kiếm theo mã sinh viên

  @ApiPropertyOptional({ enum: ["asc", "desc"], default: "desc" })
  @IsOptional()
  @IsEnum(["asc", "desc"], { each: true })
  sortOrder?: "asc" | "desc" = "desc";
}
