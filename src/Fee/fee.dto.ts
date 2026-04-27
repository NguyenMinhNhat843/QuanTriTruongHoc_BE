import { ApiProperty, PartialType } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class CreateFeeDto {
  @ApiProperty({
    example: "Bảo hiểm y tế",
    description: "Tên của loại phí hoặc danh mục thu",
    minLength: 3,
  })
  @IsString({ message: "Tên danh mục phí phải là chuỗi ký tự" })
  @IsNotEmpty({ message: "Tên danh mục phí không được để trống" })
  @MinLength(3, { message: "Tên danh mục phí phải có ít nhất 3 ký tự" })
  name: string;
}

export class UpdateFeeDto extends PartialType(CreateFeeDto) {}
