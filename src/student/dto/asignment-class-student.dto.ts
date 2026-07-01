import { ApiProperty } from "@nestjs/swagger";

export class AssignmentClassStudentDto {
  @ApiProperty({ type: [Number], isArray: true })
  studentId: number[];

  @ApiProperty({ type: Number })
  studentPerClass: number;

  @ApiProperty({ type: Number })
  batchId: number;
}
