import { ApiProperty } from "@nestjs/swagger";

export class OverviewStatsResponseDto {
  @ApiProperty({ example: 1200 })
  totalStudents: number;

  @ApiProperty({ example: 85 })
  totalTeachers: number;

  @ApiProperty({ example: 850 })
  studyingStudents: number;

  @ApiProperty({ example: 150 })
  pendingStudents: number;

  @ApiProperty({ example: 200 })
  registerStudents: number;
}
