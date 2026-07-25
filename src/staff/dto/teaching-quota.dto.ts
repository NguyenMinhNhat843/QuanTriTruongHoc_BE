import { ApiProperty, OmitType, PartialType, PickType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { TeachingQuota } from "../../../prisma/generated/prisma/client";

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

// CREATE DTO
export class CreateTeachingQuotaDto extends OmitType(TeachingQuotaDto, ["id", "createdAt", "updatedAt"]) {}

// UPDATE DTO
export class UpdateTeachingQuotaDto extends PartialType(CreateTeachingQuotaDto) {}

// SEARCH DTO
export class SearchTeachingQuotaDto extends PartialType(PickType(TeachingQuotaDto, ["staffId", "teachingLevelId"])) {}
