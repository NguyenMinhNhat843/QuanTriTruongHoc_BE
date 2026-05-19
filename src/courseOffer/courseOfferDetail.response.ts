import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import { CourseOfferRegisResponseDto } from "./ourseOfferRegis.response";
import { StaffResponseDto } from "../staff/staff.response";
import { SemesterResponseDto } from "../semester/semester.response";
import { SubjectResponseDto } from "../subject/subject.response";
import { ClassResponseDto } from "../class/class.response";
import { Type } from "class-transformer";
import { CourseOfferStatus } from "../../prisma/generated/prisma/enums";
import { CourseOffer } from "../../prisma/generated/prisma/client";

export class CourseOfferDetailResponseDto implements CourseOffer {
  @ApiProperty({ example: 1, description: "ID duy nhất của lớp học phần" })
  @IsInt()
  @IsNotEmpty()
  id: number;

  @ApiProperty({
    example: "COMP1411_02",
    description: "Mã lớp học phần (thường gồm mã môn + số thứ tự lớp)",
  })
  @IsString()
  @IsNotEmpty()
  courseCode: string;

  @ApiPropertyOptional({
    example: "Lớp kỹ thuật lập trình - Nhóm 2",
    nullable: true,
    description: "Tên hiển thị tùy chỉnh của lớp học phần",
    type: String,
  })
  @IsString()
  @IsOptional()
  courseName: string | null;

  @ApiPropertyOptional({
    example: 12,
    nullable: true,
    description: "ID của giảng viên phụ trách lớp học phần",
    type: Number,
  })
  @IsInt()
  @IsOptional()
  teacherId: number | null;

  @ApiPropertyOptional({
    example: 5,
    nullable: true,
    description:
      "ID của lớp sinh viên hành chính (nếu mở riêng cho lớp cố định)",
    type: Number,
  })
  @IsInt()
  @IsOptional()
  classId: number | null;

  @ApiProperty({ example: 2, description: "ID của học kỳ mở lớp học phần này" })
  @IsInt()
  @IsNotEmpty()
  semesterId: number;

  @ApiProperty({ example: 104, description: "ID của môn học gốc" })
  @IsInt()
  @IsNotEmpty()
  subjectId: number;

  @ApiProperty({
    example: 40,
    description: "Số lượng sinh viên tối đa của lớp học phần",
  })
  @IsInt()
  @Min(0)
  maxStudents: number;

  @ApiProperty({
    example: 35,
    description: "Số lượng sinh viên hiện tại đã đăng ký thành công",
  })
  @IsInt()
  @Min(0)
  currentStudents: number;

  @ApiProperty({
    example: "OPEN",
    enum: CourseOfferStatus,
    description: "Trạng thái hiện tại của lớp học phần",
  })
  @IsEnum(CourseOfferStatus)
  status: CourseOfferStatus;

  @ApiPropertyOptional({
    example: "2026-06-01T00:00:00.000Z",
    nullable: true,
    description: "Ngày bắt đầu học",
    type: Date,
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  startDate: Date | null;

  @ApiPropertyOptional({
    example: "2026-10-15T00:00:00.000Z",
    nullable: true,
    description: "Ngày kết thúc học phần",
    type: Date,
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endDate: Date | null;

  @ApiPropertyOptional({
    example: "2026-05-15T00:00:00.000Z",
    nullable: true,
    description: "Thời gian bắt đầu mở cổng đăng ký",
    type: Date,
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  registrationStart: Date | null;

  @ApiPropertyOptional({
    example: "2026-05-25T23:59:59.000Z",
    nullable: true,
    description: "Thời gian đóng cổng đăng ký",
    type: Date,
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  registrationEnd: Date | null;

  @ApiProperty({
    example: "2026-05-16T02:15:00.000Z",
    description: "Thời điểm tạo bản ghi lớp học phần",
  })
  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty({
    example: "2026-05-16T03:00:00.000Z",
    description: "Thời điểm cập nhật bản ghi gần nhất",
  })
  @IsDate()
  @Type(() => Date)
  updatedAt: Date;

  // --- CÁC QUAN HỆ ĐI KÈM (RELATION FIELDS) ---

  @ApiPropertyOptional({
    type: () => ClassResponseDto,
    nullable: true,
    description: "Thông tin lớp hành chính liên kết",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ClassResponseDto)
  baseClass: ClassResponseDto | null;

  @ApiPropertyOptional({
    type: () => SubjectResponseDto,
    nullable: true,
    description: "Thông tin chi tiết của môn học",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SubjectResponseDto)
  subject: SubjectResponseDto | null;

  @ApiPropertyOptional({
    type: () => SemesterResponseDto,
    nullable: true,
    description: "Thông tin chi tiết của học kỳ",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SemesterResponseDto)
  semester: SemesterResponseDto | null;

  @ApiPropertyOptional({
    type: () => StaffResponseDto,
    nullable: true,
    description: "Thông tin chi tiết của giảng viên phụ trách",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => StaffResponseDto)
  teacher: StaffResponseDto | null;

  @ApiPropertyOptional({
    type: [CourseOfferRegisResponseDto], // Khai báo mảng Object cho Swagger
    nullable: true,
    description: "Danh sách các đơn đăng ký của sinh viên vào lớp học phần này",
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CourseOfferRegisResponseDto)
  registrations: CourseOfferRegisResponseDto[] | null;
}
