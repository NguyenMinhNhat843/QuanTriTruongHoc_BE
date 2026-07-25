import { ApiProperty, OmitType, PartialType, PickType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ManagementPosition } from "../../../prisma/generated/prisma/client";

export class ManagementPositionDto implements ManagementPosition {
  @ApiProperty()
  id: number;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  @Type(() => Number)
  priority: number;

  @ApiProperty()
  @Type(() => Number)
  reductionPercent: number;

  @ApiProperty()
  @Type(() => Boolean)
  isActive: boolean;

  @ApiProperty()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty()
  @Type(() => Date)
  updatedAt: Date;
}

// CREATE DTO
export class CreateManagementPositionDto extends OmitType(ManagementPositionDto, ["id", "createdAt", "updatedAt"]) {}

// UPDATE DTO
export class UpdateManagementPositionDto extends PartialType(CreateManagementPositionDto) {}

// SEARCH DTO
export class SearchManagementPositionDto extends PartialType(
  PickType(ManagementPositionDto, ["code", "name", "isActive"]),
) {}
