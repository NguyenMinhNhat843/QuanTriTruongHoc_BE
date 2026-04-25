import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  MaxLength,
  Min,
  IsBoolean,
} from "class-validator";
import { PartialType } from "@nestjs/swagger";

export class CreateSubjectDto {
  @ApiProperty({ example: "BAS1201", description: "Mã môn học duy nhất" })
  @IsString()
  @IsNotEmpty({ message: "Mã môn học không được để trống" })
  @MaxLength(20)
  subjectCode: string;

  @ApiProperty({ example: "Lập trình hướng đối tượng" })
  @IsString()
  @IsNotEmpty({ message: "Tên môn học không được để trống" })
  @MaxLength(255)
  subjectName: string;

  @ApiProperty({ example: 3, default: 0 })
  @IsInt()
  @Min(0)
  credits: number;

  @ApiProperty({ example: 30, default: 0 })
  @IsInt()
  @Min(0)
  theoryHours: number;

  @ApiProperty({ example: 15, default: 0 })
  @IsInt()
  @Min(0)
  practiceHours: number;

  @ApiProperty({ example: 1, description: "ID của khoa quản lý môn học" })
  @IsInt()
  @IsNotEmpty()
  deptId: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isMandatory?: boolean;

  @ApiPropertyOptional({ example: "Học về Java hoặc C++" })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateSubjectDto extends PartialType(CreateSubjectDto) {}
