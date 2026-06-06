import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { CourseOfferRegisResponseDto } from "./grades.response";
import { Type } from "class-transformer";

export class CreateCourseRegistrationDto {
  @ApiProperty({ example: 1, description: "ID của Sinh viên" })
  @IsInt()
  @IsNotEmpty()
  studentId: number;

  @ApiProperty({ example: 1, description: "ID của Lớp học phần" })
  @IsInt()
  @IsNotEmpty()
  courseOfferId: number;

  @ApiPropertyOptional({
    example: "Đăng ký học cải thiện điểm",
    description: "Ghi chú",
  })
  @IsString()
  @IsOptional()
  note?: string;
}

export class UpdateCourseRegistrationDto extends PartialType(
  CourseOfferRegisResponseDto,
) {}

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
