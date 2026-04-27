import { ApiProperty, PartialType } from "@nestjs/swagger";
import { IsNotEmpty, IsInt, IsOptional, IsBoolean, Min } from "class-validator";

export class CreateFeeCatalogDto {
  @ApiProperty({
    example: "1",
    description: "ID của danh mục phí (từ bảng Fee)",
  })
  @IsInt()
  @IsNotEmpty()
  feeId: number;

  @ApiProperty({ example: 500000, description: "Số tiền" })
  @IsInt({ message: "Số tiền phải là số nguyên" })
  @Min(0, { message: "Số tiền không được nhỏ hơn 0" })
  amount: number;

  @ApiProperty({
    example: false,
    description: "Có áp dụng cho toàn bộ sinh viên không?",
  })
  @IsOptional()
  @IsBoolean()
  isGlobal?: boolean;

  @ApiProperty({
    example: "1",
    description: "Áp dụng riêng cho ngành này (nếu có)",
    required: false,
  })
  @IsOptional()
  @IsInt()
  majorId?: number;

  @ApiProperty({
    example: "2",
    description: "Áp dụng riêng cho khóa này (nếu có)",
    required: false,
  })
  @IsOptional()
  @IsInt()
  batchId?: number;

  @ApiProperty({
    example: 1,
    description: "Áp dụng cho học kỳ cụ thể",
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  semester?: number;
}

export class UpdateFeeCatalogDto extends PartialType(CreateFeeCatalogDto) {}
