import { ApiProperty } from "@nestjs/swagger";

class OverloadedClassDto {
  @ApiProperty({ example: "CNTTK1A" })
  className: string;

  @ApiProperty({ example: "42/40" })
  size: string;
}

class ClassroomsStatsDto {
  @ApiProperty({ example: 25 })
  totalActiveClasses: number;

  @ApiProperty({ example: 84.5 })
  schoolFillRate: number;

  @ApiProperty({ example: 2 })
  overloadedClassesCount: number;

  @ApiProperty({ type: [OverloadedClassDto] })
  overloadedClasses: OverloadedClassDto[];

  @ApiProperty({ example: 850 })
  totalCurrentStudents: number;

  @ApiProperty({ example: 1000 })
  totalMaxStudents: number;
}

class AdmissionsStatsDto {
  @ApiProperty({ example: 350 })
  totalProfilesProcessed: number;

  @ApiProperty({ example: 12 })
  alertMissingDocuments: number;
}

class BehaviorAssessmentDto {
  @ApiProperty({ example: 45 })
  notSubmitted: number;

  @ApiProperty({ example: 120 })
  pendingApproval: number;

  @ApiProperty({ example: 680 })
  approved: number;
}

export class AdvancedAnalyticsResponseDto {
  @ApiProperty({ example: "HK1 2026-2027" })
  semesterName: string;

  @ApiProperty({ type: ClassroomsStatsDto })
  classrooms: ClassroomsStatsDto;

  @ApiProperty({ type: AdmissionsStatsDto })
  admissions: AdmissionsStatsDto;

  @ApiProperty({ type: BehaviorAssessmentDto, nullable: true })
  behaviorAssessment: BehaviorAssessmentDto | null;
}
