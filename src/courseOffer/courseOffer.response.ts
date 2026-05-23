import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
  Min,
  IsNumber,
  IsBoolean,
  IsDate,
} from "class-validator";
import {
  CourseOffer,
  CourseOfferStatus,
} from "../../prisma/generated/prisma/client";
import { StaffResponseDto } from "../staff/staff.response";
import { SubjectResponseDto } from "../subject/subject.response";
import { ClassResponseDto } from "../class/class.response";
import { SemesterResponseDto } from "../semester/semester.response";
import { Type } from "class-transformer";

export class CourseOfferDto implements CourseOffer {
  @ApiProperty({ example: 1 })
  @IsInt()
  id: number;

  @ApiProperty({ example: "OOP-2026-HK1-01", description: "Mã lớp học phần" })
  @IsString()
  @IsNotEmpty()
  courseCode: string;

  @ApiPropertyOptional({ example: "Lập trình hướng đối tượng - Nhóm 01" })
  @IsString()
  @IsOptional()
  courseName: string | null;

  @ApiProperty({ example: 40 })
  @IsInt()
  @Min(0)
  maxStudents: number;

  @ApiProperty({ example: 0 })
  @IsInt()
  currentStudents: number;

  @ApiProperty({ enum: CourseOfferStatus, default: CourseOfferStatus.planned })
  @IsEnum(CourseOfferStatus)
  status: CourseOfferStatus;

  @ApiPropertyOptional({ type: Date, example: "2026-09-01" })
  @IsDateString()
  @IsOptional()
  startDate: Date | null;

  @ApiPropertyOptional({ type: Date, example: "2026-12-31" })
  @IsDateString()
  @IsOptional()
  endDate: Date | null;

  @ApiProperty({
    description: "ID của lớp học",
    example: 101,
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: "classId phải là số nguyên" })
  classId: number | null;

  @ApiProperty({
    description: "Thời gian tạo bản ghi",
    example: "2026-05-23T06:50:00.000Z",
    type: String,
    format: "date-time",
  })
  @IsNotEmpty({ message: "createdAt không được để trống" })
  @IsDate({ message: "createdAt không đúng định dạng ngày tháng" })
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty({
    description: "Thời gian cập nhật bản ghi gần nhất",
    example: "2026-05-23T07:15:00.000Z",
    type: String,
    format: "date-time",
  })
  @IsNotEmpty({ message: "updatedAt không được để trống" })
  @IsDate({ message: "updatedAt không đúng định dạng ngày tháng" })
  @Type(() => Date)
  updatedAt: Date;

  @ApiProperty({
    description: "Thời gian kết thúc đăng ký",
    example: "2026-06-30T23:59:59.000Z",
    type: String,
    format: "date-time",
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsDate({ message: "registrationEnd không đúng định dạng ngày tháng" })
  @Type(() => Date)
  registrationEnd: Date | null;

  @ApiProperty({
    description: "Thời gian bắt đầu mở đăng ký",
    example: "2026-06-01T00:00:00.000Z",
    type: String,
    format: "date-time",
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsDate({ message: "registrationStart không đúng định dạng ngày tháng" })
  @Type(() => Date)
  registrationStart: Date | null;

  @ApiProperty({
    description: "ID của giáo viên giảng dạy",
    example: 12,
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: "teacherId phải là số nguyên" })
  teacherId: number | null;

  @ApiProperty({
    description: "ID của học kỳ",
    example: 3,
  })
  @IsNotEmpty({ message: "semesterId không được để trống" })
  @IsInt({ message: "semesterId phải là số nguyên" })
  semesterId: number;

  @ApiProperty({
    description: "ID của môn học",
    example: 45,
  })
  @IsNotEmpty({ message: "subjectId không được để trống" })
  @IsInt({ message: "subjectId phải là số nguyên" })
  subjectId: number;

  // --- THÔNG TIN TỐI GIẢN TỪ CÁC QUAN HỆ ---

  @ApiProperty({ type: StaffResponseDto })
  teacher?: StaffResponseDto | null;

  @ApiProperty({ type: SubjectResponseDto })
  subject?: SubjectResponseDto;

  @ApiPropertyOptional({ type: ClassResponseDto })
  baseClass?: ClassResponseDto;

  @ApiProperty({ type: SemesterResponseDto })
  semester?: SemesterResponseDto;

  constructor(partial: Partial<CourseOfferDto>) {
    Object.assign(this, partial);
  }
}

export class ResponseGetDetailCourseOffer extends CourseOfferDto {}

/**
 * Response api previewGenerateSectionForClass
 * Xem trước danh sách các lớp sẽ sinh ra cho 1 lớp hành chính và học kỳ nhất định
 */
export class ResponsePreviewGenerateSectionForClass {
  @ApiProperty({
    description: "ID của môn học trong hệ thống",
    example: 12,
  })
  @IsNumber()
  subjectId: number;

  @ApiProperty({
    description: "Mã viết tắt của môn học",
    example: "CO1023",
  })
  @IsString()
  subjectCode: string;

  @ApiProperty({
    description: "Tên đầy đủ của môn học",
    example: "Cấu trúc dữ liệu và giải thuật",
  })
  @IsString()
  subjectName: string;

  @ApiProperty({
    description: "Số tín chỉ của môn học",
    example: 3,
  })
  @IsNumber()
  credits: number;

  @ApiProperty({
    description: "Mã lớp học phần dự kiến sẽ được sinh ra",
    example: "CO1023-22DTH01-HK2-2025-2026",
  })
  @IsString()
  expectedCourseCode: string;

  @ApiProperty({
    description: "Tên lớp học phần dự kiến hiển thị cho sinh viên",
    example: "Cấu trúc dữ liệu và giải thuật (Lớp Công nghệ thông tin 1)",
  })
  @IsString()
  expectedCourseName: string;

  @ApiProperty({
    description:
      "Trạng thái lớp học phần này đã tồn tại trong hệ thống hay chưa",
    example: false,
  })
  @IsBoolean()
  isExisted: boolean;
}
