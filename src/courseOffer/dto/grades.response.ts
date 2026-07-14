import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDate,
  ValidateNested,
  IsNumber,
  Min,
  Max,
} from "class-validator";
import { Type } from "class-transformer";
import { StudentResponseDto } from "../../student/dto/student.response";
import { GradeStudent } from "../../../prisma/generated/prisma/client";

// Giả sử bạn có Enum cho trạng thái đăng ký, nếu không có bạn có thể bỏ IsEnum và dùng IsString
export enum RegistrationStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export class GradeStudentDto implements GradeStudent {
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  id: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  kttx1!: number | null;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  kttx2!: number | null;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  kttx3!: number | null;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  ktdk1!: number | null;

  @ApiPropertyOptional({
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  ktdk2!: number | null;

  @ApiPropertyOptional({
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  ktdk3!: number | null;

  @ApiPropertyOptional({
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  ktdk4!: number | null;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  rating: string | null;

  @ApiPropertyOptional({
    type: Number,
  })
  @IsOptional()
  @IsNumber({})
  @Min(0)
  @Max(10)
  diemKiemTra1!: number | null;

  @ApiPropertyOptional({
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  diemKiemTra2!: number | null;

  @ApiPropertyOptional({
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  diemTB!: number | null;

  @ApiPropertyOptional({
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  diemTongKet1!: number | null;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  diemTongKet2!: number | null;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  courseOfferId: number;

  @ApiProperty({ example: 20260001, description: "ID của sinh viên đăng ký" })
  @IsInt()
  @IsNotEmpty()
  studentId: number;

  @ApiPropertyOptional({
    nullable: true,
    type: String,
  })
  @IsString()
  @IsOptional()
  note: string | null;

  @ApiProperty({
    example: "2026-05-16T02:15:00.000Z",
    description: "Thời điểm tạo bản ghi",
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

  @ApiProperty({
    type: () => StudentResponseDto,
    description: "Thông tin chi tiết của sinh viên đăng ký",
  })
  @ValidateNested()
  @Type(() => StudentResponseDto)
  student: StudentResponseDto;
}

export class SubjectGradeResponseDto {
  @ApiProperty()
  gradeId!: number;

  @ApiProperty()
  subjectId!: number;

  @ApiProperty()
  subjectCode!: string;

  @ApiProperty()
  subjectName!: string;

  @ApiProperty()
  credits!: number;

  @ApiProperty({ nullable: true })
  kttx1!: number | null;

  @ApiProperty({ nullable: true })
  kttx2!: number | null;

  @ApiProperty({ nullable: true })
  kttx3!: number | null;

  @ApiProperty({ nullable: true })
  ktdk1!: number | null;

  @ApiProperty({ nullable: true })
  ktdk2!: number | null;

  @ApiProperty({ nullable: true })
  ktdk3!: number | null;

  @ApiProperty({ nullable: true })
  ktdk4!: number | null;

  @ApiProperty({ nullable: true })
  diemTB!: number | null;

  @ApiProperty({ nullable: true })
  diemTongKet1!: number | null;

  @ApiProperty({ nullable: true })
  diemTongKet2!: number | null;

  @ApiProperty({ nullable: true })
  finalScore!: number | null;

  @ApiProperty()
  gradeFour!: number;

  @ApiProperty()
  gradeLetter!: string;

  @ApiProperty()
  isPassed!: boolean;
}

export class SemesterTranscriptResponseDto {
  @ApiProperty()
  semesterId!: number;

  @ApiProperty()
  semesterName!: string;

  @ApiProperty()
  term!: number;

  @ApiProperty()
  year!: number;

  @ApiProperty({ nullable: true })
  schoolYear!: string | null;

  @ApiProperty({ type: [SubjectGradeResponseDto] })
  subjects!: SubjectGradeResponseDto[];

  @ApiProperty()
  semesterGPA10!: number;

  @ApiProperty()
  semesterGPA4!: number;

  @ApiProperty()
  semesterCredits!: number;

  @ApiProperty()
  cumulativeCPA10!: number;

  @ApiProperty()
  cumulativeCPA4!: number;

  @ApiProperty()
  cumulativeCredits!: number;
}

export class StudentInfoResponseDto {
  @ApiProperty()
  studentId!: number;

  @ApiProperty()
  studentCode!: string;

  @ApiProperty()
  fullName!: string;
}

export class StudentTranscriptResponseDto {
  @ApiProperty({ type: StudentInfoResponseDto })
  studentInfo!: StudentInfoResponseDto;

  @ApiProperty({ type: [SemesterTranscriptResponseDto] })
  transcript!: SemesterTranscriptResponseDto[];
}
