import { ApiProperty, ApiPropertyOptional, PartialType, PickType } from "@nestjs/swagger";
import { SubjectCombination, SubjectCombinationItem } from "../../../prisma/generated/prisma/client";

export class SubjectCombinationItemDto implements SubjectCombinationItem {
  @ApiProperty()
  id: number;

  @ApiProperty()
  subjectCombinationId: number;

  @ApiProperty()
  subjectName: string;
}

export class CreateSubjectCombinationItemDto extends PickType(SubjectCombinationItemDto, ["subjectName"]) {}

export class SubjectCombinationDto implements SubjectCombination {
  @ApiProperty()
  id: number;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;
}

export class SubjectCombinationDetailDto extends SubjectCombinationDto {
  @ApiPropertyOptional({ type: [SubjectCombinationItemDto] })
  items?: SubjectCombinationItemDto[];
}

export class SubjectCombinationPaginationDto {
  @ApiProperty({ type: [SubjectCombinationDetailDto] })
  data: SubjectCombinationDetailDto[];

  @ApiProperty()
  total: number;
}

// CREATE DTO
export class CreateSubjectCombinationDto extends PickType(SubjectCombinationDto, ["code", "name"]) {
  @ApiPropertyOptional({ type: [CreateSubjectCombinationItemDto] })
  items?: CreateSubjectCombinationItemDto[];
}

// UPDATE DTO
export class UpdateSubjectCombinationDto extends PartialType(CreateSubjectCombinationDto) {}

// SEARCH DTO
export class SearchSubjectCombinationDto extends PartialType(PickType(SubjectCombinationDto, ["code", "name"])) {
  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  limit?: number;
}
