import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  MaxLength,
} from "class-validator";
import { PartialType } from "@nestjs/swagger";

export class CreateMajorDto {
  @ApiProperty({ example: "CNTT", description: "Mã ngành đào tạo" })
  @IsString()
  @IsNotEmpty({ message: "Mã ngành không được để trống" })
  @MaxLength(20)
  majorCode: string;

  @ApiProperty({ example: "Công nghệ thông tin" })
  @IsString()
  @IsNotEmpty({ message: "Tên ngành không được để trống" })
  @MaxLength(255)
  majorName: string;

  @ApiPropertyOptional({
    example: 1,
    description: "ID của phòng ban/khoa trực thuộc",
  })
  @IsInt()
  deptId?: number;

  @ApiPropertyOptional({
    example: "Ngành học tập trung vào phát triển phần mềm",
  })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateMajorDto extends PartialType(CreateMajorDto) {}
