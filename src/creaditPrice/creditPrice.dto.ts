import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { IsInt, IsOptional, IsBoolean, Min, IsNotEmpty } from "class-validator";

export class CreateCreditPriceDto {
  @ApiPropertyOptional({
    description: "ID của ngành học (nếu áp dụng riêng cho ngành)",
  })
  @IsOptional()
  @IsInt()
  majorId?: number;

  @ApiPropertyOptional({
    description: "ID của khóa học/batch (nếu áp dụng riêng cho khóa)",
  })
  @IsOptional()
  @IsInt()
  batchId?: number;

  @ApiPropertyOptional({ description: "Học kỳ áp dụng" })
  @IsOptional()
  @IsInt()
  semester?: number;

  @ApiProperty({
    description: "Áp dụng chung cho toàn bộ trường",
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isGlobal?: boolean;

  @ApiProperty({ description: "Giá tiền trên mỗi tín chỉ", example: 500000 })
  @IsNotEmpty()
  @IsInt()
  @Min(0)
  price: number;
}

export class UpdateCreditPriceDto extends PartialType(CreateCreditPriceDto) {
  // Tất cả các thuộc tính từ CreateCreditPriceDto bây giờ đều là optional
}
