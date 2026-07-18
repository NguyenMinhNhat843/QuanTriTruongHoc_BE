import { ApiProperty, PartialType, PickType } from "@nestjs/swagger";
import {
  IsOptional,
  IsString,
  IsInt,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  IsEnum,
} from "class-validator";
import { Type } from "class-transformer";
import {
  AssessmentDetailDto,
  AssessmentDto,
  CriterionDto,
  EvaluationPeriodCriterionDto,
  EvaluationPeriodDto,
} from "../assessment-response.dto";
import { AssessmentStatus } from "../../../prisma/generated/prisma/enums";

// ====== CRETION DTOs ======
export class CreateCriterionDto extends PickType(CriterionDto, [
  "title",
  "maxScore",
  "sortOrder",
] as const) {}

export class UpdateCriterionDto extends PartialType(CreateCriterionDto) {}

// =========== PERIOD: Đợt Đánh giá =============
export class CreatePeriodDto extends PickType(EvaluationPeriodDto, [
  "name",
  "semesterId",
] as const) {
  @ApiProperty({
    type: [Number],
  })
  criterionIds?: number[];
}

export class UpdatePeriodDto extends PartialType(CreatePeriodDto) {}

// ======= Bảng Trung gian: PeriodCriterion =======
export class CreatePeriodCriterionDto extends PickType(
  EvaluationPeriodCriterionDto,
  ["criterionId", "periodId", "maxScoreSnapshot"] as const,
) {}

// ======== Assessment: Phiếu điểm của từng học sinh ==========
export class CreateAssessmentDto extends PickType(AssessmentDto, [
  "studentId",
  "periodId",
] as const) {}

export class AssessmentDetailUpdateDto {
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  id: number; // ID của dòng AssessmentDetail cần update

  @ApiProperty()
  @IsInt()
  @IsOptional()
  studentScore?: number;

  @ApiProperty()
  @IsInt()
  @IsOptional()
  teacherScore?: number;
}

export class UpdateAssessmentDto {
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  assessmentId: number;

  @ApiProperty({ enum: AssessmentStatus })
  @IsEnum(AssessmentStatus)
  @IsNotEmpty()
  status: AssessmentStatus;

  @ApiProperty({ nullable: true })
  @IsString()
  @IsOptional()
  teacherComment?: string;

  @ApiProperty({
    type: [AssessmentDetailUpdateDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssessmentDetailUpdateDto)
  details: AssessmentDetailUpdateDto[];
}

// Lấy phiếu điểm rèn luyện của 1 học sinh trong 1 học kỳ
export class LoadAssessmentDto {
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  studentId: number;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  semesterId: number;
}

// ========= AssessmentDetail: Chi tiết điểm theo từng tiêu chí ==========
export class CreateAssessmentDetailDto extends PickType(AssessmentDetailDto, [
  "assessmentId",
  "periodCriterionId",
  "criterionId",
  "studentScore",
  "teacherScore",
] as const) {}

// ======== Response DTOs ==========
export class EvaluationSummaryDataDto {
  @ApiProperty()
  hasActivePeriod: boolean;

  @ApiProperty({ type: String, nullable: true })
  message?: string;

  @ApiProperty({ type: String, nullable: true })
  periodName: string | null;

  @ApiProperty({ type: Boolean, nullable: true })
  isFrozen?: boolean;

  @ApiProperty({ type: AssessmentDto, nullable: true })
  assessment: AssessmentDto | null;
}
