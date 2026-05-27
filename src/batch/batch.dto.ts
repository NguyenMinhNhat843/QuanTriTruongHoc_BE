import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { Exclude, Type } from "class-transformer";
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";
import { BatchResponseDto } from "./batch.response";

export class BatchDto implements BatchResponseDto {
  @ApiProperty({ example: "K1", description: "Mã khóa học viết tắt" })
  @IsString()
  @IsNotEmpty()
  batchCode: string;

  @ApiProperty({ example: "Khóa 1", description: "Tên đầy đủ của khóa" })
  @IsString()
  @IsNotEmpty()
  batchName: string;

  @ApiProperty({ example: 2026, description: "Năm bắt đầu khóa học" })
  @IsInt()
  @IsNotEmpty()
  startYear: number;

  @ApiProperty({ example: 2030, description: "Năm kết thúc dự kiến" })
  @IsInt()
  @IsNotEmpty()
  endYear: number;

  @ApiPropertyOptional({ example: "Khóa đào tạo kỹ sư CNTT" })
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty({ example: 1, description: "ID ngành học mà khóa này thuộc về" })
  @IsInt()
  @IsNotEmpty()
  majorId: number;

  @ApiPropertyOptional({
    example: 1,
    description: "ID chương trình đào tạo nếu có",
  })
  @IsInt()
  @IsOptional()
  curriculumId: number; // Thêm trường curriculumId nếu cần thiết

  @ApiPropertyOptional({
    example: "ADMISSION",
    description: "Trạng thái: ADMISSION, ACTIVE, GRADUATED",
    default: "ACTIVE",
  })
  @IsString()
  @IsOptional()
  status: string = "ACTIVE";

  // Các filed không trả về
  @ApiPropertyOptional()
  @IsOptional()
  createdAt?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  updatedAt?: Date;
}

export class CreateBatchDto extends BatchDto {}

export class UpdateBatchDto extends PartialType(CreateBatchDto) {}

export class SearchBatchDto {
  @ApiPropertyOptional({
    example: "2",
    description: "Từ khóa tìm kiếm mã hoặc tên khóa",
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  majorId?: number;

  @ApiPropertyOptional({
    example: "CNTT",
    description: "Từ khóa tìm kiếm mã hoặc ngành",
  })
  @IsString()
  @IsOptional()
  majorCode?: string;
}
