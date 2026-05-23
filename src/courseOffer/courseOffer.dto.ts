import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from "class-validator";
import {
  CourseOfferStatus,
  DayOfWeek,
} from "../../prisma/generated/prisma/enums";

/**
 * Dto search lớp học phần
 */
export class SearchCourseOfferDto {
  @ApiPropertyOptional({
    description: "ID của lớp hành chính (Lớp danh nghĩa)",
  })
  @IsOptional()
  @IsInt()
  @Transform(({ value }) => Number(value))
  classId?: number;

  @ApiPropertyOptional({
    description: "ID của ngành học",
  })
  @IsOptional()
  @IsInt()
  @Transform(({ value }) => Number(value))
  majorId?: number;

  @ApiPropertyOptional({
    description: "ID của học kỳ",
  })
  @IsOptional()
  @IsInt()
  @Transform(({ value }) => Number(value))
  semesterId?: number;

  @ApiPropertyOptional({
    description: "ID của giảng viên phụ trách",
  })
  @IsOptional()
  @IsInt()
  @Transform(({ value }) => Number(value))
  teacherId?: number;

  @ApiPropertyOptional({
    description: "Tìm kiếm theo Mã hoặc Tên lớp học phần",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: "Trạng thái lớp học phần (planned, open, closed, cancelled)",
    enum: CourseOfferStatus,
  })
  @IsOptional()
  @IsEnum(CourseOfferStatus)
  status?: CourseOfferStatus;
}

export class CreateBulkCourseOfferDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  semesterId: number;

  @ApiProperty({ example: 3 })
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  batchId: number;

  @ApiPropertyOptional({ description: "Thời gian bắt đầu, format StringDate" })
  @IsDateString()
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional({ description: "Thời gian kết thúc, format StringDate" })
  @IsDateString()
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional({
    example: 50,
    description:
      "Số lượng sinh viên tối đa mặc định nếu lớp danh nghĩa không có dữ liệu",
  })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
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

  @ApiPropertyOptional({
    example: 15,
    description: "ID giảng viên phụ trách (nếu muốn chỉ định ngay)",
  })
  @IsInt()
  @IsOptional()
  teacherId?: number;

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

export class ScheduleItemDto {
  @ApiProperty({
    example: "MONDAY",
    enum: DayOfWeek,
    description: "Thứ trong tuần",
  })
  @IsEnum(DayOfWeek)
  @IsNotEmpty()
  dayOfWeek: DayOfWeek;

  @ApiProperty({
    example: "07:30",
    description: "Giờ bắt đầu (Định dạng HH:mm)",
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):?([0-5]\d)$/, {
    message: "startTime must be in HH:mm format",
  })
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({
    example: "11:00",
    description: "Giờ kết thúc (Định dạng HH:mm)",
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):?([0-5]\d)$/, {
    message: "endTime must be in HH:mm format",
  })
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({ example: 1, description: "ID của phòng học" })
  @IsInt()
  @IsNotEmpty()
  roomId: number;
}

export class AssignScheduleDto {
  @ApiProperty({
    example: 101,
    description: "ID của lớp học phần (CourseOffer)",
  })
  @IsInt()
  @IsNotEmpty()
  courseOfferId: number;

  @ApiProperty({
    example: 15,
    description: "ID của giảng viên (Staff)",
  })
  @IsInt()
  @IsNotEmpty()
  teacherId: number;

  @ApiProperty({
    type: [ScheduleItemDto],
    description: "Danh sách các buổi học trong tuần",
  })
  @IsArray()
  @ArrayMinSize(1, { message: "Phải có ít nhất một buổi học được phân bổ" })
  @ValidateNested({ each: true })
  @Type(() => ScheduleItemDto)
  schedules: ScheduleItemDto[];
}
