import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  MaxLength,
} from "class-validator";

export class CreateDepartmentDto {
  @ApiProperty({
    example: "IT01",
    description: "Mã định danh duy nhất của phòng ban/khoa",
  })
  @IsString()
  @IsNotEmpty({ message: "Mã phòng ban không được để trống" })
  @MaxLength(20)
  deptCode: string;

  @ApiProperty({
    example: "Khoa Công nghệ thông tin",
    description: "Tên đầy đủ của phòng ban/khoa",
  })
  @IsString()
  @IsNotEmpty({ message: "Tên phòng ban không được để trống" })
  @MaxLength(255)
  deptName: string;

  @ApiPropertyOptional({
    example: "Chuyên đào tạo lập trình viên và kỹ sư hệ thống",
    description: "Mô tả chi tiết về phòng ban",
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 1,
    description: "ID của nhân viên (Staff) làm trưởng khoa",
  })
  @IsInt()
  @IsOptional()
  headOfDepartmentId?: number;
}

export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {}
