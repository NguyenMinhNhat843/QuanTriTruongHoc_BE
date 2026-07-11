import { ApiProperty } from "@nestjs/swagger";

export class AcademicSummaryDto {
  @ApiProperty()
  cumulativeGpa: number;

  @ApiProperty()
  totalAccumulatedCredits: number;

  @ApiProperty()
  completedSubjectsCount: number;
}

export class SemesterHistoryDto {
  @ApiProperty()
  semesterName: string;

  @ApiProperty()
  gpa: number;

  @ApiProperty()
  credits: number;
}

export class AcademicWidgetDataDto {
  @ApiProperty({ type: AcademicSummaryDto })
  summary: AcademicSummaryDto;

  @ApiProperty({ type: [SemesterHistoryDto] })
  chartData: SemesterHistoryDto[];
}

export class AcademicSummaryResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: AcademicWidgetDataDto })
  data: AcademicWidgetDataDto;
}
