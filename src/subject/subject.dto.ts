import { ApiProperty, OmitType, PickType } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  IsDate,
} from "class-validator";
import { PartialType } from "@nestjs/swagger";
import { Subject } from "../../prisma/generated/prisma/client";

export class SubjectDto implements Subject {
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  id: number;

  @ApiProperty({ type: Number, nullable: true })
  @IsInt()
  @IsOptional()
  departmentId: number | null;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  subjectCode: string;

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

export class CreateSubjectDto extends OmitType(SubjectDto, [
  "id",
  "createdAt",
  "updatedAt",
] as const) {}

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
  keuword?: string;
}

export class ResponseSubjectDto extends SubjectDto {}
