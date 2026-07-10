import { ApiProperty, OmitType, PartialType } from "@nestjs/swagger";
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { ElectiveGroup } from "../../../prisma/generated/prisma/client";
import { CurriculumSubjectResponseDtoWithRelation } from "./curriculum-subject.dto";

export class ElectiveGroupDto implements ElectiveGroup {
  @ApiProperty()
  @IsInt()
  @Type(() => Number)
  id: number;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  curriculumId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  groupName: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  minCredits: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  minSubjects: number;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  createdAt: Date;
}

export class ElectiveGroupResponseDto extends ElectiveGroupDto {
  @ApiProperty({ type: [CurriculumSubjectResponseDtoWithRelation] })
  curriculumSubjects: CurriculumSubjectResponseDtoWithRelation[];
}

export class ElectiveSubjectPayload {
  @ApiProperty()
  @IsInt()
  @Type(() => Number)
  subjectId: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  semesterNumber: number;

  @ApiProperty({ type: Number, required: false })
  @IsOptional()
  @Type(() => Number)
  minGrade?: number = 5.0;
}

export class ElectiveGroupPayload extends OmitType(ElectiveGroupDto, [
  "id",
  "curriculumId",
  "createdAt",
  "updatedAt",
] as const) {
  @ApiProperty({ type: [ElectiveSubjectPayload] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ElectiveSubjectPayload)
  subjects: ElectiveSubjectPayload[];
}

export class CreateElectiveGroupDto extends OmitType(ElectiveGroupDto, [
  "id",
  "updatedAt",
  "createdAt",
] as const) {}

export class UpdateElectiveGroupDto extends PartialType(
  CreateElectiveGroupDto,
) {}
