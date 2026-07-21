import { ApiProperty, OmitType, PartialType, PickType } from "@nestjs/swagger";
import { ExamScore } from "../../../prisma/generated/prisma/client";

export class ExamScoreDto implements ExamScore {
  @ApiProperty()
  id: number;

  @ApiProperty()
  admissionProfileId: number;

  @ApiProperty({ example: "MATH", description: "Mã môn học (MATH, LITERATURE, ENGLISH,...)" })
  subjectCode: string;

  @ApiProperty({ example: 8.5 })
  score: number;
}

// CREATE DTO
export class CreateExamScoreDto extends OmitType(ExamScoreDto, ["id"]) {}

// UPDATE DTO
export class UpdateExamScoreDto extends PartialType(CreateExamScoreDto) {}

// SEARCH DTO
export class SearchExamScoreDto extends PartialType(PickType(ExamScoreDto, ["admissionProfileId", "subjectCode"])) {}

// RESPONSE TYPE (PAGINATION)
export class ResponseExamScorePaginationDto {
  @ApiProperty({ type: [ExamScoreDto] })
  data: ExamScoreDto[];

  @ApiProperty({ type: Number })
  total: number;
}
