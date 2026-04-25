import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsOptional,
  IsDateString,
} from "class-validator";
import { PartialType } from "@nestjs/swagger";

export class CreateSemesterDto {
  @ApiProperty({ example: "HK1-2026", description: "Tên học kỳ" })
  @IsString()
  @IsNotEmpty({ message: "Tên học kỳ không được để trống" })
  name: string;

  @ApiProperty({ example: "2025-2026", description: "Năm học" })
  @IsString()
  @IsNotEmpty({ message: "Năm học không được để trống" })
  schoolYear: string;

  @ApiProperty({ example: "2026-09-01", description: "Ngày bắt đầu học kỳ" })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ example: "2027-01-15", description: "Ngày kết thúc học kỳ" })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

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
