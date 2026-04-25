import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsInt,
  IsOptional,
  Min,
  IsBoolean,
  IsNumber,
  Max,
} from "class-validator";
import { PartialType } from "@nestjs/swagger";

export class CreateCurriculumSubjectDto {
  @ApiProperty({ example: 1, description: "ID của chương trình khung" })
  @IsInt()
  @IsNotEmpty()
  curriculumId: number;

  @ApiProperty({ example: 1, description: "ID của môn học" })
  @IsInt()
  @IsNotEmpty()
  subjectId: number;

  @ApiProperty({
    example: 1,
    description: "Học kỳ gợi ý (Ví dụ: kỳ 1, kỳ 2...)",
  })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  semesterNumber: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isMandatory?: boolean;

  @ApiPropertyOptional({
    example: 5.0,
    default: 5.0,
    description: "Điểm tối thiểu qua môn",
  })
  @IsNumber()
  @Min(0)
  @Max(10)
  @IsOptional()
  minGrade?: number;
}

export class UpdateCurriculumSubjectDto extends PartialType(
  CreateCurriculumSubjectDto,
) {}
