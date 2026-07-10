import { ApiProperty, OmitType, PickType } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  IsDate,
  ValidateNested,
} from "class-validator";
import { PartialType } from "@nestjs/swagger";
import {
  KnowledgeBlock,
  Subject,
} from "../../../prisma/generated/prisma/client";
import { Type } from "class-transformer";
import { SubjectConditionDto } from "./subject-condition.dto";

export class SubjectDto implements Subject {
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  id: number;

  @ApiProperty({ type: Number, nullable: true })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  departmentId: number | null;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  subjectCode: string;

  @ApiProperty({ enum: KnowledgeBlock })
  knowledgeBlock: KnowledgeBlock;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  subjectName: string;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  credits: number;

  @ApiProperty({ type: String, nullable: true })
  @IsString()
  @IsOptional()
  description: string | null;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  practiceHours: number;

  @ApiProperty({ type: Number, nullable: true })
  @IsInt()
  @IsOptional()
  testHours: number | null;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  theoryHours: number;

  @ApiProperty()
  @IsDate()
  @IsNotEmpty()
  createdAt: Date;

  @ApiProperty()
  @IsDate()
  @IsNotEmpty()
  updatedAt: Date;
}

export class SubjectConditionPayload extends PickType(SubjectConditionDto, [
  "conditionSubjectId",
  "conditionType",
]) {}
export class CreateSubjectDto extends OmitType(SubjectDto, [
  "id",
  "createdAt",
  "updatedAt",
] as const) {
  @ApiProperty({ type: [SubjectConditionPayload], required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SubjectConditionPayload)
  subjectConditions?: SubjectConditionPayload[];
}

export class UpdateSubjectDto extends PartialType(CreateSubjectDto) {}

export class SearchSubjectDto extends PartialType(
  PickType(SubjectDto, [
    "id",
    "departmentId",
    "subjectCode",
    "subjectName",
  ] as const),
) {
  @ApiProperty({ type: String, required: false })
  keyword?: string;

  @ApiProperty({ type: Number, required: false })
  majorId?: number;
}

export class ResponseSubjectDto extends SubjectDto {}
