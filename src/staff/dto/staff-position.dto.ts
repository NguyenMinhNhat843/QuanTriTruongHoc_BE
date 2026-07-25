import { ApiProperty, OmitType, PartialType, PickType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { StaffPosition } from "../../../prisma/generated/prisma/client";

// BASE DTO
export class StaffPositionDto implements StaffPosition {
  @ApiProperty()
  id: number;

  @ApiProperty()
  @Type(() => Number)
  staffId: number;

  @ApiProperty()
  @Type(() => Number)
  positionId: number;

  @ApiProperty({ type: Number, nullable: true })
  @Type(() => Number)
  departmentId: number | null;

  @ApiProperty()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty({ type: Date, nullable: true })
  @Type(() => Date)
  endDate: Date | null;

  @ApiProperty()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty()
  @Type(() => Date)
  updatedAt: Date;
}

// CREATE DTO
export class CreateStaffPositionDto extends OmitType(StaffPositionDto, ["id", "createdAt", "updatedAt"]) {}

// UPDATE DTO
export class UpdateStaffPositionDto extends PartialType(CreateStaffPositionDto) {}

// SEARCH DTO
export class SearchStaffPositionDto extends PartialType(
  PickType(StaffPositionDto, ["staffId", "positionId", "departmentId"]),
) {}
