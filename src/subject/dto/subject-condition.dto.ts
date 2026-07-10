import { ApiProperty, OmitType, PartialType } from "@nestjs/swagger";
import { IsEnum, IsInt, IsNotEmpty } from "class-validator";
import { Type } from "class-transformer";
import {
  ConditionType,
  SubjectCondition,
} from "../../../prisma/generated/prisma/client";
import { SubjectDto } from "./subject.dto";

export class SubjectConditionDto implements SubjectCondition {
  @ApiProperty()
  @IsInt()
  @Type(() => Number)
  id: number;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  subjectId: number;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  conditionSubjectId: number;

  @ApiProperty({ enum: ConditionType })
  @IsEnum(ConditionType)
  @IsNotEmpty()
  conditionType: ConditionType;

  @ApiProperty()
  createdAt: Date;
}

export class SubjectConditionDetailDto extends SubjectConditionDto {
  @ApiProperty({ type: () => SubjectDto })
  conditionSubject: SubjectDto;
}

export class CreateSubjectConditionDto extends OmitType(SubjectConditionDto, [
  "id",
  "createdAt",
] as const) {}

export class UpdateSubjectConditionDto extends PartialType(
  CreateSubjectConditionDto,
) {}
