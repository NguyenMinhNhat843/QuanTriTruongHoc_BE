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
} from "class-validator";
import {
  CourseOffer,
  CourseOfferStatus,
} from "../../prisma/generated/prisma/client";

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

  @ApiPropertyOptional({ example: "2026-09-01" })
  @IsDateString()
  @IsOptional()
  startDate: Date | null;

  @ApiPropertyOptional({ example: "2026-12-31" })
  @IsDateString()
  @IsOptional()
  endDate: Date | null;

  classId: number | null;
  createdAt: Date;
  updatedAt: Date;
  registrationEnd: Date | null;
  registrationStart: Date | null;
  teacherId: number | null;
  semesterId: number;
  subjectId: number;

  // --- THÔNG TIN TỐI GIẢN TỪ CÁC QUAN HỆ ---

  @ApiProperty({ description: "Thông tin giáo viên tối giản" })
  teacher?: {
    id: number;
    staffCode: string;
    fullName: string;
  };

  @ApiProperty({ description: "Thông tin môn học" })
  subject: {
    id: number;
    subjectCode: string;
    subjectName: string;
    credits: number;
  };

  @ApiPropertyOptional({ description: "Lớp hành chính liên quan" })
  baseClass: {
    id: number;
    classCode: string;
    className: string;
  } | null;

  @ApiProperty({ description: "Học kỳ" })
  semester: {
    id: number;
    name: string;
    schoolYear: string;
  };

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
