import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  Max,
} from "class-validator";

export class CreateBatchDto {
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
  @Min(2000)
  @Max(2100)
  @IsNotEmpty()
  startYear: number;

  @ApiProperty({ example: 2030, description: "Năm kết thúc dự kiến" })
  @IsInt()
  @Min(2000)
  @Max(2100)
  @IsNotEmpty()
  endYear: number;

  @ApiPropertyOptional({ example: "Khóa đào tạo kỹ sư CNTT" })
  @IsString()
  @IsOptional()
  description?: string;

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
  curriculumId?: number; // Thêm trường curriculumId nếu cần thiết

  @ApiPropertyOptional({
    example: "ADMISSION",
    description: "Trạng thái: ADMISSION, ACTIVE, GRADUATED",
    default: "ACTIVE",
  })
  @IsString()
  @IsOptional()
  status?: string = "ACTIVE";
}

export class UpdateBatchDto extends PartialType(CreateBatchDto) {
  // Tất cả các trường từ CreateBatchDto giờ đều là Optional (?)
  // Bạn có thể ghi đè hoặc thêm logic riêng cho Update nếu cần
}
