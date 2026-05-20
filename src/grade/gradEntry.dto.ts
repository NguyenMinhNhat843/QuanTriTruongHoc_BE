import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsArray,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateGradeEntryDto {
  @ApiProperty({
    example: 1,
    description:
      "ID của thành phần điểm (Ví dụ: 1 là Thường kỳ 1, 3 là Giữa kỳ)",
  })
  @IsInt()
  @IsNotEmpty()
  componentId: number;

  @ApiPropertyOptional({
    example: 8.5,
    nullable: true,
    type: Number,
    description:
      "Điểm số của học sinh (Thang điểm 10, chấp nhận số thập phân). Để null nếu chưa nhập.",
  })
  @IsNumber({ maxDecimalPlaces: 2 }) // Giới hạn tối đa 2 chữ số thập phân
  @Min(0)
  @Max(10)
  @IsOptional()
  score: number | null;

  @ApiProperty({ type: Number })
  @IsNumber()
  courseRegistrationId: number;
}

/**
 * Lưu nháp điểm
 */
export class CreateManyGradeEntriesDto {
  @ApiProperty({
    type: [CreateGradeEntryDto],
    description: "Danh sách mảng các đầu điểm chi tiết của từng học sinh",
  })
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true }) // Bắt buộc chạy sâu xuống để validate từng item trong mảng
  @Type(() => CreateGradeEntryDto) // Kích hoạt class-transformer để mapping dữ liệu lồng nhau
  grades: CreateGradeEntryDto[];
}

/**
 * Chốt điểm cho 1 lớp học phần
 */
export class SaveGradeEntries extends CreateManyGradeEntriesDto {}
