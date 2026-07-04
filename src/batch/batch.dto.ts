import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from "@nestjs/swagger";
import { Exclude, Type } from "class-transformer";
import { IsDate, IsNumber, IsOptional, IsString } from "class-validator";
import { Batch } from "../../prisma/generated/prisma/client";

export class BatchDto implements Batch {
  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  id: number;

  @ApiProperty()
  @IsString()
  batchCode: string;

  @ApiProperty()
  @IsString()
  batchName: string;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  majorId: number;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  curriculumId: number | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  description: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  endTerm: number | null;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  endYear: number;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  startYear: number;

  @ApiProperty()
  @IsString()
  status: string;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  updatedAt: Date;
}

export class CreateBatchDto extends OmitType(BatchDto, [
  "id",
  "createdAt",
  "updatedAt",
]) {}

export class UpdateBatchDto extends PartialType(CreateBatchDto) {}

export class SearchBatchDto {
  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  majorId?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  majorCode?: string;
}
