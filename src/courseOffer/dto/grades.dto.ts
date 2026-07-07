import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { GradeStudentDto } from "./grades.response";

export class CreateCourseRegistrationDto {
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  studentId: number;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  courseOfferId: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  note?: string;
}

export class UpdateCourseRegistrationDto extends PartialType(GradeStudentDto) {}

export class SaveGradesDto {
  @ApiProperty()
  @IsInt()
  classSubjectId: number;

  @ApiPropertyOptional({
    type: [UpdateCourseRegistrationDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateCourseRegistrationDto)
  grades?: UpdateCourseRegistrationDto[];
}
