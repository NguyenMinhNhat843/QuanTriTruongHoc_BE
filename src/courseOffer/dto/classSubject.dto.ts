import { ApiProperty, ApiPropertyOptional, OmitType, PartialType, PickType } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from "class-validator";
import { DayOfWeek } from "../../../prisma/generated/prisma/enums";
import { ClassSubject } from "../../../prisma/generated/prisma/client";
import { StaffDto } from "../../staff/staff.dto";
import { SubjectDto } from "../../subject/dto/subject.dto";
import { ClassDto } from "../../class/class.dto";
import { SemesterDto } from "../../semester/semester.dto";
import { GradeStudentDto } from "./grades.response";
import { ClassSubjectSessionDto } from "../../schedule/dto/classSubjectSession.dto";

export class ClassSubjectDto implements ClassSubject {
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  id: number;

  @ApiProperty({ type: Number, nullable: true })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  teacherId: number | null;

  @ApiProperty({ type: Number, nullable: true })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  classId: number | null;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  semesterId: number;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  subjectId: number;

  @ApiProperty()
  @IsDate()
  @IsNotEmpty()
  createdAt: Date;

  @ApiProperty()
  @IsDate()
  @IsNotEmpty()
  updatedAt: Date;
}

export class ClassSubjectDetailDto extends ClassSubjectDto {
  @ApiPropertyOptional({ type: () => StaffDto })
  teacher?: StaffDto;

  @ApiPropertyOptional({ type: () => SubjectDto })
  subject?: SubjectDto;

  @ApiPropertyOptional({ type: () => ClassDto })
  baseClass?: ClassDto;

  @ApiPropertyOptional({ type: () => SemesterDto })
  semester?: SemesterDto;

  @ApiPropertyOptional({ type: () => GradeStudentDto, isArray: true })
  gradeStudents?: GradeStudentDto[];

  @ApiPropertyOptional({ type: () => ClassSubjectSessionDto, isArray: true })
  classSubjectSessions?: ClassSubjectSessionDto[];
}

// CREATE DTO
export class CreateClassSubjectDto extends OmitType(ClassSubjectDto, ["id", "createdAt", "updatedAt"] as const) {}

// UPDATE DTO
export class UpdateClassSubjectDto extends PartialType(CreateClassSubjectDto) {}

//SEARCH DTO
export class SearchClassSubjectDto extends PartialType(
  PickType(ClassSubjectDto, ["classId", "semesterId", "teacherId", "subjectId"] as const),
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Transform(({ value }) => Number(value))
  majorId?: number;
}

export class CreateBulkClassSubjectDto {
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

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  defaultMaxStudents?: number;
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

export class updateClassSubjectDto extends PartialType(CreateClassSubjectDto) {}

export class ExportGradeTableDto {
  @ApiProperty({
    type: [Number],
    required: true,
  })
  @IsNotEmpty({ message: "Danh sách classSubjectIds không được để trống" })
  @IsArray({ message: "classSubjectIds phải là một mảng" })
  @ArrayMinSize(1, {
    message: "Cần cung cấp ít nhất 1 classSubjectId để xuất Excel",
  })
  @IsInt({
    each: true,
    message: "Mỗi classSubjectId trong mảng phải là số nguyên",
  })
  @Transform(({ value }) => {
    if (!Array.isArray(value)) {
      return [Number(value)];
    }
    return value.map((v) => Number(v));
  })
  classSubjectIds: number[];

  @ApiPropertyOptional({})
  @IsOptional()
  @IsBoolean()
  haveTongKetSheet?: boolean;
}
