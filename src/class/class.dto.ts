import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  MaxLength,
  Min,
  Max,
} from "class-validator";
import { PartialType } from "@nestjs/swagger";

export class CreateClassDto {
  @ApiProperty({ example: "CNTT17A", description: "Mã lớp học duy nhất" })
  @IsString()
  @IsNotEmpty({ message: "Mã lớp không được để trống" })
  @MaxLength(20)
  classCode: string;

  @ApiProperty({ example: "Lớp Công nghệ thông tin 17A" })
  @IsString()
  @IsNotEmpty({ message: "Tên lớp không được để trống" })
  @MaxLength(255)
  className: string;

  @ApiProperty({ example: 1, description: "ID của ngành đào tạo" })
  @IsInt()
  @IsNotEmpty()
  majorId: number;

  @ApiProperty({ example: 2024, description: "Năm nhập học/Khóa" })
  @IsInt()
  @Min(2000)
  @IsNotEmpty()
  courseYear: number;

  @ApiPropertyOptional({
    example: 1,
    description: "ID của giáo viên chủ nhiệm",
  })
  @IsInt()
  @IsOptional()
  formTeacherId?: number;

  @ApiPropertyOptional({ example: 40, default: 40 })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxStudents?: number;

  @ApiPropertyOptional({ example: "active", default: "active" })
  @IsString()
  @IsOptional()
  status?: string;
}

export class UpdateClassDto extends PartialType(CreateClassDto) {}

export class AssignClassDto {
  @ApiProperty({
    example: 1,
    description: "ID của Ngành cần phân lớp",
  })
  @IsInt()
  @IsNotEmpty()
  majorId: number;

  @ApiProperty({
    example: 1,
    description: "ID của Khóa đào tạo cần phân lớp",
  })
  @IsInt()
  @IsNotEmpty()
  batchId: number;

  @ApiPropertyOptional({
    example: 30,
    description: "Số lượng sinh viên tối đa trong một lớp",
    default: 40,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  maxStudents?: number = 40;
}
