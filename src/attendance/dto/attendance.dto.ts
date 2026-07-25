import {
  ApiExtraModels,
  ApiProperty,
  ApiPropertyOptional,
  getSchemaPath,
  OmitType,
  PartialType,
  PickType,
} from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString } from "class-validator";
import { Attendance, AttendanceStatus, ExamEligibilityStatus } from "../../../prisma/generated/prisma/client";
import { StudentDto } from "../../student/dtos/student.dto";
import { ClassSubjectScheduleDetailDto } from "../../schedule/dto/classSubjectScheduleDetail";
import { ClassSubjectDto } from "../../courseOffer/dto/classSubject.dto";
import { StaffDto } from "../../staff/staff.dto";

export class AttendanceDto implements Attendance {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  id: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  studentId: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  classSubjectId: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  scheduleDetailId: number;

  @ApiProperty({ enum: AttendanceStatus })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @ApiProperty({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  note: string | null;

  @ApiProperty({ type: Number, nullable: true })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  recordedById: number | null;

  @ApiProperty()
  @Type(() => Date)
  recordedAt: Date;
}

export class AttendanceDetailDto extends AttendanceDto {
  @ApiProperty({ type: () => StudentDto, required: false })
  student?: StudentDto;

  @ApiProperty({ type: () => ClassSubjectScheduleDetailDto, required: false })
  scheduleDetail?: ClassSubjectScheduleDetailDto;

  @ApiProperty({ type: () => ClassSubjectDto, required: false })
  classSubject?: ClassSubjectDto;

  @ApiProperty({ type: () => StaffDto, required: false })
  recordBy?: StaffDto;
}

// CRUD DTO
export class CreateAttendanceDto extends OmitType(AttendanceDto, ["id", "recordedAt", "recordedById"]) {}

// CREATE BULK DTO
export class NestedAttendanceForCreateBulkDto extends PickType(AttendanceDto, ["studentId", "status", "note"]) {}
export class CreateBulkAttendanceDto {
  @ApiProperty({ type: Number })
  scheduleDetailId: number;

  @ApiProperty({ type: Number })
  classSubjectId: number;

  @ApiProperty({ type: [NestedAttendanceForCreateBulkDto] })
  attendances: NestedAttendanceForCreateBulkDto[];
}

// UPDATE DTO
export class UpdateAttendanceDto extends PartialType(OmitType(AttendanceDto, ["id", "recordedAt", "recordedById"])) {}
export class SearchAttendanceDto extends PartialType(
  PickType(AttendanceDto, ["studentId", "classSubjectId", "scheduleDetailId", "status"]),
) {}

// LẤY MA TRẬN ĐIỂM DANH CỦA 1 CLASSSUBJECT (classSubject)
export class AttendanceSheetInfoDto {
  @ApiProperty()
  @Type(() => Number)
  classSubjectId: number;

  @ApiProperty()
  subjectName: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  className: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  teacherName: string | null;

  @ApiProperty()
  semesterName: string;
}

// Thông tin cột Buổi học (Cột của ma trận)
export class AttendanceSheetScheduleDto {
  @ApiProperty()
  @Type(() => Number)
  scheduleDetailId: number;

  @ApiProperty()
  @Type(() => Number)
  weekNumber: number;

  @ApiPropertyOptional({ type: Date, nullable: true })
  @Type(() => Date)
  studyDate: Date | null;

  @ApiProperty()
  dayOfWeek: string;

  @ApiProperty()
  shift: string;

  @ApiProperty()
  @Type(() => Number)
  startPeriod: number;

  @ApiProperty()
  @Type(() => Number)
  endPeriod: number;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @Type(() => Number)
  countPeriod: number | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  roomCode: string | null;
}

// Chi tiết điểm danh từng buổi của sinh viên (Value trong map)
export class AttendanceItemDto {
  @ApiProperty({ enum: AttendanceStatus })
  status: AttendanceStatus;

  @ApiPropertyOptional({ type: String, nullable: true })
  note: string | null;
}

// Tổng hợp chuyên cần thu gọn
export class AttendanceSummaryShortDto {
  @ApiProperty()
  @Type(() => Number)
  totalPeriods: number;

  @ApiProperty()
  @Type(() => Number)
  totalAbsentPeriods: number;

  @ApiProperty()
  @Type(() => Number)
  absentPercentage: number;

  @ApiProperty({ enum: ExamEligibilityStatus })
  examStatus: ExamEligibilityStatus;

  @ApiProperty()
  isManuallyLocked: boolean;
}

// Thông tin Sinh viên + Map Điểm danh (Dòng của ma trận)
@ApiExtraModels(AttendanceItemDto)
export class AttendanceSheetStudentDto {
  @ApiProperty()
  @Type(() => Number)
  studentId: number;

  @ApiProperty()
  studentCode: string;

  @ApiProperty()
  fullName: string;

  @ApiPropertyOptional({ type: Date, nullable: true })
  @Type(() => Date)
  dob: Date | null;

  @ApiProperty({
    type: "object",
    additionalProperties: {
      $ref: getSchemaPath(AttendanceItemDto),
    },
    description: "Map dạng: { [scheduleDetailId]: { status, note } }",
  })
  attendances: Record<number, AttendanceItemDto>;

  @ApiPropertyOptional({ type: () => AttendanceSummaryShortDto, nullable: true })
  @Type(() => AttendanceSummaryShortDto)
  summary: AttendanceSummaryShortDto | null;
}

// 6. DTO Tổng trả về cho toàn bộ API
export class AttendanceSheetResponseDto {
  @ApiProperty({ type: () => AttendanceSheetInfoDto })
  @Type(() => AttendanceSheetInfoDto)
  info: AttendanceSheetInfoDto;

  @ApiProperty({ type: [AttendanceSheetScheduleDto] })
  @Type(() => AttendanceSheetScheduleDto)
  schedules: AttendanceSheetScheduleDto[];

  @ApiProperty({ type: [AttendanceSheetStudentDto] })
  @Type(() => AttendanceSheetStudentDto)
  students: AttendanceSheetStudentDto[];
}
