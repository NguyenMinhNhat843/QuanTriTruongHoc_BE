import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class SubjectCombinationItemDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  subjectCombinationId: number;

  @ApiProperty()
  subjectCode: string;
}

export class CreateSubjectCombinationItemDto {
  @ApiProperty()
  subjectCode: string;
}

export class SubjectCombinationDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ type: [SubjectCombinationItemDto] })
  items?: SubjectCombinationItemDto[];
}

export class CreateSubjectCombinationDto {
  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ type: [CreateSubjectCombinationItemDto] })
  items?: CreateSubjectCombinationItemDto[];
}

export class UpdateSubjectCombinationDto {
  @ApiPropertyOptional()
  code?: string;

  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional({ type: [CreateSubjectCombinationItemDto] })
  items?: CreateSubjectCombinationItemDto[];
}

export class SearchSubjectCombinationDto {
  @ApiPropertyOptional()
  code?: string;

  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  limit?: number;
}

