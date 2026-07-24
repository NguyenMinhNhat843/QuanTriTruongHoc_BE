import { ApiProperty, ApiPropertyOptional, OmitType, PartialType, PickType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { AttendanceSummary, ExamEligibilityStatus } from "../../../prisma/generated/prisma/client";
import { StudentDto } from "../../student/dtos/student.dto";
import { ClassSubjectDto } from "../../courseOffer/dto/classSubject.dto";

export class AttendanceSummaryDto implements AttendanceSummary {
  @ApiProperty()
  @Type(() => Number)
  id: number;

  @ApiProperty()
  @Type(() => Number)
  studentId: number;

  @ApiProperty()
  @Type(() => Number)
  classSubjectId: number;

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

  @ApiProperty({ type: String, nullable: true })
  lockReason: string | null;

  @ApiProperty()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty()
  @Type(() => Date)
  updatedAt: Date;
}

export class AttendanceSummaryDetailDto extends AttendanceSummaryDto {
  @ApiPropertyOptional({ type: () => StudentDto })
  student?: StudentDto;

  @ApiPropertyOptional({ type: () => ClassSubjectDto })
  classSubject?: ClassSubjectDto;
}

// CRUD DTO
export class CreateAttendanceSummaryDto extends OmitType(AttendanceSummaryDto, [
  "id",
  "createdAt",
  "updatedAt",
] as const) {}
export class UpdateAttendanceSummaryDto extends PartialType(CreateAttendanceSummaryDto) {}
export class SearchAttendanceSummaryDto extends PartialType(
  PickType(AttendanceSummaryDto, ["id", "studentId", "classSubjectId"]),
) {}
