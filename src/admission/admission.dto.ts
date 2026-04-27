import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

export class CreateAdmissionItemDto {
  @ApiProperty({ example: 1, description: "ID của Khóa đào tạo (Batch)" })
  @IsInt()
  @IsNotEmpty()
  batchId: number;

  @ApiProperty({
    example: 50,
    description: "Chỉ tiêu tuyển sinh cho ngành này",
  })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  quota: number;
}

export class CreateAdmissionDto {
  @ApiProperty({ example: "Đợt 1 - Tuyển sinh 2026" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: "2026-03-01T00:00:00Z" })
  @IsDateString()
  @IsNotEmpty()
  startDate: Date;

  @ApiProperty({ example: "2026-06-30T23:59:59Z" })
  @IsDateString()
  @IsNotEmpty()
  endDate: Date;

  @ApiProperty({
    type: [CreateAdmissionItemDto],
    description: "Danh sách các ngành và khóa học trong đợt tuyển sinh này",
  })
  @IsArray()
  @ValidateNested({ each: true }) // Kiểm tra tính hợp lệ của từng item trong mảng
  @Type(() => CreateAdmissionItemDto) // Yêu cầu class-transformer nhận diện kiểu dữ liệu lồng nhau
  @IsNotEmpty()
  items: CreateAdmissionItemDto[];
}
