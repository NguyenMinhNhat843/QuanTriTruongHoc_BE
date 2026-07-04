import { ApiProperty, OmitType, PartialType } from "@nestjs/swagger";
import { IsDate, IsInt } from "class-validator";
import { Type } from "class-transformer";
import { CurriculumSubject } from "../../../prisma/generated/prisma/client";
import { SubjectDto } from "../../subject/subject.dto";

export class CurriculumSubjectDto implements CurriculumSubject {
  @ApiProperty()
  @IsInt()
  @Type(() => Number)
  id: number;

  @ApiProperty()
  @IsInt()
  @Type(() => Number)
  semesterNumber: number;

  @ApiProperty()
  @IsInt()
  @Type(() => Number)
  curriculumId: number;

  @ApiProperty()
  @IsInt() // Hoặc @IsNumber() nếu minGrade có thể là số thập phân (e.g., 4.0, 5.5)
  @Type(() => Number)
  minGrade: number;

  @ApiProperty()
  @IsInt()
  @Type(() => Number)
  subjectId: number;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  createdAt: Date;
}

export class CreateCurriculumSubjectDto extends OmitType(CurriculumSubjectDto, [
  "id",
  "createdAt",
] as const) {}

export class UpdateCurriculumSubjectDto extends PartialType(
  CreateCurriculumSubjectDto,
) {}

// RESPONSE TYPE
export class CurriculumSubjectResponseDtoWithRelation extends CurriculumSubjectDto {
  @ApiProperty({ type: () => SubjectDto })
  subject: SubjectDto;
}
