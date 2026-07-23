import { ApiProperty, OmitType } from "@nestjs/swagger";

export class TranscriptSubjectScoreDto implements TranscriptSubjectScoreDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  gradeLevel: number;

  @ApiProperty()
  subjectCode: string;

  @ApiProperty()
  score: number;
}

export class CreateTranscriptSubjectScoreDto extends OmitType(TranscriptSubjectScoreDto, ["id"] as const) {}
