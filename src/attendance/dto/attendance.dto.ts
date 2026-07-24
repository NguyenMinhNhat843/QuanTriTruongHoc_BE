import { ApiProperty, OmitType, PartialType, PickType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString } from "class-validator";
import { Attendance, AttendanceStatus } from "../../../prisma/generated/prisma/client";
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
export class UpdateAttendanceDto extends PartialType(OmitType(AttendanceDto, ["id", "recordedAt", "recordedById"])) {}
export class SearchAttendanceDto extends PartialType(
  PickType(AttendanceDto, ["studentId", "classSubjectId", "scheduleDetailId", "status"]),
) {}
