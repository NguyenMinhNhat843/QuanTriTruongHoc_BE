import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PriorityRegion, PriorityObject } from "../../../prisma/generated/prisma/client.js";

export class PriorityRuleDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  academicYearId: number;

  @ApiPropertyOptional({ enum: PriorityRegion })
  priorityRegion?: PriorityRegion;

  @ApiPropertyOptional({ enum: PriorityObject })
  priorityObject?: PriorityObject;

  @ApiProperty()
  bonusScore: number;
}

export class CreatePriorityRuleDto {
  @ApiProperty()
  academicYearId: number;

  @ApiPropertyOptional({ enum: PriorityRegion })
  priorityRegion?: PriorityRegion;

  @ApiPropertyOptional({ enum: PriorityObject })
  priorityObject?: PriorityObject;

  @ApiProperty()
  bonusScore: number;
}

export class UpdatePriorityRuleDto {
  @ApiPropertyOptional()
  academicYearId?: number;

  @ApiPropertyOptional({ enum: PriorityRegion })
  priorityRegion?: PriorityRegion;

  @ApiPropertyOptional({ enum: PriorityObject })
  priorityObject?: PriorityObject;

  @ApiPropertyOptional()
  bonusScore?: number;
}

export class SearchPriorityRuleDto {
  @ApiPropertyOptional()
  academicYearId?: number;

  @ApiPropertyOptional({ enum: PriorityRegion })
  priorityRegion?: PriorityRegion;

  @ApiPropertyOptional({ enum: PriorityObject })
  priorityObject?: PriorityObject;

  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  limit?: number;
}

