import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PickType,
} from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  IsDate,
} from "class-validator";
import { PartialType } from "@nestjs/swagger";
import { Major } from "../../prisma/generated/prisma/client";
import { Type } from "class-transformer";
import { DepartmentDto } from "../department/department.dto";

export class MajorDto implements Major {
  @ApiProperty()
  @IsInt()
  @Type(() => Number)
  id: number;

  @ApiProperty()
  @IsInt()
  @Type(() => Number)
  deptId: number;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  description: string | null;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  majorCode: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  majorName: string;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  updatedAt: Date;
}

export class MajorSimpleDto extends PickType(MajorDto, [
  "id",
  "majorCode",
  "majorName",
] as const) {}

export class CreateMajorDto extends OmitType(MajorDto, [
  "id",
  "createdAt",
  "updatedAt",
] as const) {}

export class UpdateMajorDto extends PartialType(CreateMajorDto) {}

// Response type
export class MajorResponseWithRelationDto extends MajorDto {
  @ApiPropertyOptional({ type: () => DepartmentDto })
  department?: DepartmentDto;
}
