import { ApiProperty } from "@nestjs/swagger";
import {
  Assessment,
  AssessmentDetail,
  AssessmentStatus,
  Criterion,
  EvaluationGrade,
  EvaluationPeriod,
} from "../../prisma/generated/prisma/client";

// ==========================================
// 1. EvaluationPeriodDto
// ==========================================
export class EvaluationPeriodDto implements EvaluationPeriod {
  @ApiProperty()
  id: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  semesterId: number;

  @ApiProperty()
  isFrozen: boolean;

  @ApiProperty()
  name: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

// ==========================================
// 2. CriterionDto
// ==========================================
export class CriterionDto implements Criterion {
  @ApiProperty()
  id: number;

  @ApiProperty()
  maxScore: number;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

// ==========================================
// 3. AssessmentDto
// ==========================================
export class AssessmentDto implements Assessment {
  @ApiProperty()
  id: number;

  @ApiProperty()
  periodId: number;

  @ApiProperty()
  studentId: number;

  @ApiProperty({ enum: AssessmentStatus })
  status: AssessmentStatus;

  @ApiProperty()
  totalStudentScore: number;

  @ApiProperty()
  totalTeacherScore: number;

  @ApiProperty({ enum: EvaluationGrade, nullable: true })
  finalGrade: EvaluationGrade | null;

  @ApiProperty({ nullable: true })
  teacherComment: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

// ==========================================
// 4. AssessmentDetailDto
// ==========================================
export class AssessmentDetailDto implements AssessmentDetail {
  @ApiProperty()
  id: number;

  @ApiProperty()
  assessmentId: number;

  @ApiProperty()
  criterionId: number;

  @ApiProperty()
  studentScore: number;

  @ApiProperty()
  teacherScore: number;
}

export class AssessmentDetailDtoWithRelation extends AssessmentDetailDto {
  @ApiProperty({ type: CriterionDto })
  criterion: CriterionDto;
}

export class AssessmentDtoWithRelation extends AssessmentDto {
  @ApiProperty({ type: [AssessmentDetailDtoWithRelation] })
  details: AssessmentDetailDtoWithRelation[];
}
