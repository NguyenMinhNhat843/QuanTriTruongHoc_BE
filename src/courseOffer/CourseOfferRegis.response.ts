import { ApiProperty } from "@nestjs/swagger";

export class StudentGradeSummaryDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "SV001" })
  studentCode: string;

  @ApiProperty({ example: "Nguyễn Văn A" })
  fullName: string;

  @ApiProperty({
    example: [8.5, 9.0],
    description: "Danh sách điểm số của sinh viên trong lớp này",
  })
  gradeEntries: { componentId: string; score: number }[];
}
