import { ApiProperty, ApiPropertyOptional, OmitType, PartialType, PickType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { TeachingQuota } from "../../../prisma/generated/prisma/client";
import { TeachingLevelDto } from "./teaching-level.dto";

// BASE DTO
export class TeachingQuotaDto implements TeachingQuota {
  @ApiProperty()
  id: number;

  @ApiProperty()
  @Type(() => Number)
  staffId: number;

  @ApiProperty()
  @Type(() => Number)
  teachingLevelId: number;

  @ApiProperty()
  @Type(() => Number)
  baseHours: number;

  @ApiProperty()
  @Type(() => Number)
  reductionPercent: number;

  @ApiProperty()
  @Type(() => Number)
  actualHours: number;

  @ApiProperty()
  @Type(() => Number)
  finalHours: number;

  @ApiProperty()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty()
  @Type(() => Date)
  updatedAt: Date;
}

// RESPONSE DETAIL DTO
export class TeachingQuotaDetailResponseDto extends TeachingQuotaDto {
  @ApiPropertyOptional({ type: TeachingLevelDto })
  teachingLevel?: TeachingLevelDto;
}

// RESPONSE PAGINATION DTO
export class TeachingQuotaPaginationResponseDto {
  @ApiProperty({ type: [TeachingQuotaDto] })
  data: TeachingQuotaDto[];

  @ApiProperty()
  total: number;
}

// CREATE DTO
export class CreateTeachingQuotaDto extends OmitType(TeachingQuotaDto, ["id", "createdAt", "updatedAt"]) {}

// UPDATE DTO
export class UpdateTeachingQuotaDto extends PartialType(CreateTeachingQuotaDto) {}

// SEARCH DTO
export class SearchTeachingQuotaDto extends PartialType(PickType(TeachingQuotaDto, ["staffId", "teachingLevelId"])) {
  @ApiPropertyOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional()
  academicYearId?: number;
}
