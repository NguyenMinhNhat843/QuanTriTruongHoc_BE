import { ApiProperty, ApiPropertyOptional, OmitType } from "@nestjs/swagger";
import { IsOptional, IsString, IsNumber, IsDate } from "class-validator";
import { PartialType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { Class } from "../../prisma/generated/prisma/client";

export class ClassDto implements Class {
  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  id: number;

  @ApiProperty()
  @IsString()
  classCode: string;

  @ApiProperty()
  @IsString()
  className: string;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  majorId: number;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  batchId: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  formTeacherId: number | null;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  currentSize: number;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  maxStudents: number;

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

export class SearchClassDto extends PartialType(ClassDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}

export class CreateClassDto extends OmitType(ClassDto, [
  "id",
  "createdAt",
  "updatedAt",
]) {
  @ApiPropertyOptional({ type: String, default: "active" })
  @IsString()
  @IsOptional()
  status: string = "active";
}

export class UpdateClassDto extends PartialType(CreateClassDto) {}
