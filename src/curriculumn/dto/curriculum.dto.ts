import { ApiProperty, ApiPropertyOptional, OmitType } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsNumber,
  IsDate,
} from "class-validator";
import { PartialType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { Curriculum } from "../../../prisma/generated/prisma/client";
import { MajorDto } from "../../major/major.dto";
import {
  CreateCurriculumSubjectDto,
  CurriculumSubjectResponseDtoWithRelation,
} from "./curriculum-subject.dto";

export class CurriculumDto implements Curriculum {
  @ApiProperty()
  @IsInt()
  @Type(() => Number)
  id: number;

  @ApiProperty()
  @IsInt()
  @Type(() => Number)
  majorId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  curriculumCode: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  curriculumName: string;

  @ApiProperty()
  @IsBoolean()
  @Type(() => Boolean)
  isActive: boolean;

  @ApiProperty()
  @IsInt()
  @Type(() => Number)
  totalCredits: number;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  updatedAt: Date;
}

export class CurriculumSubjectPayload extends OmitType(
  CreateCurriculumSubjectDto,
  ["curriculumId"] as const,
) {}
export class CreateCurriculumDto extends OmitType(CurriculumDto, [
  "id",
  "createdAt",
  "updatedAt",
] as const) {
  @ApiProperty({
    type: [CurriculumSubjectPayload],
    description:
      "Danh sách các môn học bắt buộc (hoặc tự chọn tự do không theo nhóm)",
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CurriculumSubjectPayload)
  curriculumSubjects: CurriculumSubjectPayload[];
}

export class UpdateCurriculumDto extends PartialType(CreateCurriculumDto) {}

export class SearchCurriculumDto {
  @ApiPropertyOptional({ type: Number })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  batchId?: number;

  @ApiPropertyOptional({ type: Number })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  majorId?: number;
}

// RESPONSE TYPE
export class CurriculumResponseDtoWithRelation extends CurriculumDto {
  @ApiProperty({ type: [CurriculumSubjectResponseDtoWithRelation] })
  curriculumSubjects: CurriculumSubjectResponseDtoWithRelation[];

  @ApiProperty({ type: () => MajorDto })
  major: MajorDto;
}
