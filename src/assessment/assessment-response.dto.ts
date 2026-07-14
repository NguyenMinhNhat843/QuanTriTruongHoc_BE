import { ApiProperty } from "@nestjs/swagger";
import {
  Assessment,
  AssessmentDetail,
  AssessmentStatus,
  Criterion,
  EvaluationGrade,
  EvaluationPeriod,
  EvaluationPeriodCriterion,
} from "../../prisma/generated/prisma/client";
import { Type } from "class-transformer";
import {
  IsNumber,
  IsBoolean,
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
} from "class-validator";

// ==========================================
// 2. CriterionDto
// ==========================================
export class CriterionDto implements Criterion {
  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  id: number;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  maxScore: number;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  sortOrder: number;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  updatedAt: Date;
}

// ===== BANG TRUNG GIAN: EvaluationPeriodCriterionDto =====
export class EvaluationPeriodCriterionDto implements EvaluationPeriodCriterion {
  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  id: number;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  criterionId: number;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  periodId: number;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  maxScoreSnapshot: number;
}

export class ResponseEvaluationPeriodCriterionDtoWithRelation extends EvaluationPeriodCriterionDto {
  @ApiProperty({ type: () => CriterionDto })
  criterion: CriterionDto;
}

// ==========================================
// 1. EvaluationPeriodDto
// ==========================================
export class EvaluationPeriodDto implements EvaluationPeriod {
  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  id: number;

  @ApiProperty()
  @IsBoolean()
  @Type(() => Boolean)
  isActive: boolean;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  semesterId: number;

  @ApiProperty()
  @IsBoolean()
  @Type(() => Boolean)
  isFrozen: boolean;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  updatedAt: Date;
}
export class ResponseEvaluationPeriodDtoWithRelation extends EvaluationPeriodDto {
  @ApiProperty({
    type: () => [ResponseEvaluationPeriodCriterionDtoWithRelation],
  })
  periodCriteria: ResponseEvaluationPeriodCriterionDtoWithRelation[];
}

// ==========================================
// 4. AssessmentDetailDto
// ==========================================
export class AssessmentDetailDto implements AssessmentDetail {
  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  id: number;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  periodCriterionId: number;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  assessmentId: number;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  criterionId: number;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  studentScore: number;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  teacherScore: number;
}

// ==========================================
// 3. AssessmentDto
// ==========================================
export class AssessmentDto implements Assessment {
  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  id: number;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  periodId: number;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  studentId: number;

  @ApiProperty({ enum: AssessmentStatus })
  @IsEnum(AssessmentStatus)
  status: AssessmentStatus;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  totalStudentScore: number;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  totalTeacherScore: number;

  @ApiProperty({ enum: EvaluationGrade, nullable: true })
  @IsOptional()
  @IsEnum(EvaluationGrade)
  finalGrade: EvaluationGrade | null;

  @ApiProperty({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  teacherComment: string | null;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  updatedAt: Date;
}

export class AssessmentDetailDtoWithRelation extends AssessmentDetailDto {
  @ApiProperty({ type: () => ResponseEvaluationPeriodCriterionDtoWithRelation })
  periodCriterion: ResponseEvaluationPeriodCriterionDtoWithRelation;
}

export class ResponseAssessmentDtoWithRelation extends AssessmentDto {
  @ApiProperty({ type: () => [AssessmentDetailDtoWithRelation] })
  details: AssessmentDetailDtoWithRelation[];
}
