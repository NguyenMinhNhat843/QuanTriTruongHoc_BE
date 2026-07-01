import { ApiProperty, OmitType, PartialType } from "@nestjs/swagger";
import {
  AdmissionProfile,
  Conduct,
} from "../../../prisma/generated/prisma/client";
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
} from "class-validator";
import { Decimal } from "../../../prisma/generated/prisma/internal/prismaNamespace";

export class AdmissionProfileDto implements AdmissionProfile {
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  id: number;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
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

  @ApiProperty({ type: String })
  @IsNumberString()
  @IsNotEmpty()
  gpa6: Decimal;

  @ApiProperty({ type: String })
  @IsNumberString()
  @IsNotEmpty()
  gpa7: Decimal;

  @ApiProperty({ type: String })
  @IsNumberString()
  @IsNotEmpty()
  gpa8: Decimal;

  @ApiProperty({ type: String })
  @IsNumberString()
  @IsNotEmpty()
  gpa9: Decimal;

  @ApiProperty()
  @IsOptional()
  createdAt: Date;

  @ApiProperty()
  @IsOptional()
  updatedAt: Date;
}

export class CreateAdmissionProfileDto extends OmitType(AdmissionProfileDto, [
  "id",
  "createdAt",
  "updatedAt",
] as const) {}
export class UpdateAdmissionProfileDto extends PartialType(
  CreateAdmissionProfileDto,
) {}
