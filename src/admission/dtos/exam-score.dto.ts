import { ApiProperty, OmitType } from "@nestjs/swagger";
import { ExamScore } from "../../../prisma/generated/prisma/client";

export class ExamScoreDto implements ExamScore {
  @ApiProperty()
  id: number;

  @ApiProperty()
  subjectCode: string;

  @ApiProperty()
  score: number;

  @ApiProperty()
  admissionProfileId: number;
}

export class CreateExamScoreDto extends OmitType(ExamScoreDto, ["id", "admissionProfileId"] as const) {}
