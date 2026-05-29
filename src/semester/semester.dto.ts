import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsOptional,
  IsDateString,
  IsInt,
  IsEnum,
} from "class-validator";
import { PartialType } from "@nestjs/swagger";
import { SemesterStatus } from "../../prisma/generated/prisma/client";
import { Type } from "class-transformer";

export class CreateSemesterDto {
  @ApiProperty({ example: "HK1-2026", description: "Tên học kỳ" })
  @IsString()
  @IsNotEmpty({ message: "Tên học kỳ không được để trống" })
  name: string;

  @ApiProperty({ example: 2026, description: "Năm học của học kỳ" })
  @IsInt()
  @IsOptional()
  year: number;

  @ApiProperty({
    example: 1,
    description: "Học kỳ thứ mấy trong năm (1 hoặc 2)",
  })
  @IsInt()
  @IsNotEmpty({ message: "Học kỳ phải là số nguyên (1 hoặc 2)" })
  term: number;

  @ApiProperty({ example: "2026-09-01", description: "Ngày bắt đầu học kỳ" })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ example: "2027-01-15", description: "Ngày kết thúc học kỳ" })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiPropertyOptional({
    type: Number,
    example: 18,
    description: "Số tuần học chính thức trong học kỳ (không bắt buộc)",
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  teachingWeeks: number | null;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  schoolYear: string | null;

  @ApiPropertyOptional({
    enum: SemesterStatus,
  })
  @IsEnum(SemesterStatus)
  @IsOptional()
  status: SemesterStatus | null;

  @ApiPropertyOptional({
    example: false,
    default: false,
    description: "Đánh dấu là học kỳ hiện tại",
  })
  @IsBoolean()
  @IsOptional()
  isCurrent?: boolean;
}

export class UpdateSemesterDto extends PartialType(CreateSemesterDto) {}
