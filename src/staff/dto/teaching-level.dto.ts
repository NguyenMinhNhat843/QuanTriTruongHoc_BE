import { ApiProperty, ApiPropertyOptional, OmitType, PartialType, PickType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { TeachingLevel } from "../../../prisma/generated/prisma/client";

// BASE DTO
export class TeachingLevelDto implements TeachingLevel {
  @ApiProperty()
  id: number;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  @Type(() => Number)
  academicYearId: number;

  @ApiProperty()
  @Type(() => Number)
  minHours: number;

  @ApiProperty()
  @Type(() => Number)
  maxHours: number;

  @ApiProperty()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty()
  @Type(() => Date)
  updatedAt: Date;
}

// RESPONSE PAGINATION DTO
export class TeachingLevelPaginationResponseDto {
  @ApiProperty({ type: [TeachingLevelDto] })
  data: TeachingLevelDto[];

  @ApiProperty()
  total: number;
}

// CREATE DTO
export class CreateTeachingLevelDto extends OmitType(TeachingLevelDto, ["id", "createdAt", "updatedAt"]) {}

// UPDATE DTO
export class UpdateTeachingLevelDto extends PartialType(CreateTeachingLevelDto) {}

// SEARCH DTO
export class SearchTeachingLevelDto extends PartialType(
  PickType(TeachingLevelDto, ["code", "name", "academicYearId"]),
) {
  @ApiPropertyOptional({ type: Number })
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ type: Number })
  @Type(() => Number)
  limit?: number;
}
