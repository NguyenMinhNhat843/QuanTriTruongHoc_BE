import { ApiProperty, OmitType, PartialType } from "@nestjs/swagger";
import {
  AdmissionProfile,
  Conduct,
} from "../../../prisma/generated/prisma/client";
import { IsEnum, IsInt, IsNotEmpty, IsOptional } from "class-validator";
import { Type } from "class-transformer";

export class AdmissionProfileDto implements AdmissionProfile {
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  id: number;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  studentId: number;

  @ApiProperty({ enum: Conduct })
  @IsEnum(Conduct)
  @IsNotEmpty()
  conduct6: Conduct;

  @ApiProperty({ enum: Conduct })
  @IsEnum(Conduct)
  @IsNotEmpty()
  conduct7: Conduct;

  @ApiProperty({ enum: Conduct })
  @IsEnum(Conduct)
  @IsNotEmpty()
  conduct8: Conduct;

  @ApiProperty({ enum: Conduct })
  @IsEnum(Conduct)
  @IsNotEmpty()
  conduct9: Conduct;

  @ApiProperty({ type: Number })
  gpa6: number;

  @ApiProperty({ type: Number })
  gpa7: number;

  @ApiProperty({ type: Number })
  gpa8: number;

  @ApiProperty({ type: Number })
  gpa9: number;

  @ApiProperty()
  @IsOptional()
  createdAt: Date;

  @ApiProperty()
  @IsOptional()
  updatedAt: Date;
}

export class ResponseAdmissionProfilePaginationDto {
  @ApiProperty({ type: [AdmissionProfileDto] })
  items: AdmissionProfileDto[];

  @ApiProperty()
  total: number;
}

export class CreateAdmissionProfileDto extends OmitType(AdmissionProfileDto, [
  "id",
  "createdAt",
  "updatedAt",
] as const) {}
export class UpdateAdmissionProfileDto extends PartialType(
  CreateAdmissionProfileDto,
) {}

export class SearchAdmissionProfileDto extends PartialType(
  AdmissionProfileDto,
) {
  @ApiProperty({ required: false })
  limit?: number;

  @ApiProperty({ required: false })
  page?: number;
}
