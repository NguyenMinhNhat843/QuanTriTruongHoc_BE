import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsOptional,
  Min,
  IsBoolean,
  IsDateString,
  MaxLength,
  IsArray,
  ValidateNested,
} from "class-validator";
import { PartialType } from "@nestjs/swagger";
import { CreateCurriculumSubjectDto } from "../curriculumSubject/curriculumnSubject.dto";
import { Type } from "class-transformer";

export class CreateCurriculumDto {
  @ApiProperty({
    example: "CTK-CNTT-2023",
    description: "Mã chương trình khung duy nhất",
  })
  @IsString()
  @IsNotEmpty({ message: "Mã chương trình khung không được để trống" })
  @MaxLength(50)
  curriculumCode: string;

  @ApiProperty({ example: "Chương trình khung Công nghệ thông tin 2023" })
  @IsString()
  @IsNotEmpty({ message: "Tên chương trình không được để trống" })
  @MaxLength(255)
  curriculumName: string;

  @ApiProperty({ example: 1, description: "ID của ngành đào tạo" })
  @IsInt()
  @IsNotEmpty()
  majorId: number;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  version?: number;

  @ApiPropertyOptional({ example: 120, default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  totalCredits?: number;

  @ApiPropertyOptional({
    example: "2023-09-01",
    description: "Ngày bắt đầu áp dụng",
  })
  @IsDateString()
  @IsOptional()
  effectiveFrom?: string;

  @ApiPropertyOptional({
    example: "2027-09-01",
    description: "Ngày kết thúc áp dụng",
  })
  @IsDateString()
  @IsOptional()
  effectiveTo?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    type: [CreateCurriculumSubjectDto],
    description: "Danh sách các môn học thuộc chương trình khung",
  })
  @IsArray()
  @ValidateNested({ each: true }) // Quan trọng: Để validate từng object trong mảng
  @Type(() => CreateCurriculumSubjectDto) // Quan trọng: Để class-transformer biết kiểu dữ liệu để chuyển đổi
  curriculumSubjects: CreateCurriculumSubjectDto[];
}

export class UpdateCurriculumDto extends PartialType(CreateCurriculumDto) {}
