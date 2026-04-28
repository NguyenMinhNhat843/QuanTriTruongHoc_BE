import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
  IsInt,
  Min,
  IsArray,
  ValidateNested,
  IsDateString,
  ArrayMinSize,
} from "class-validator";
import { Type } from "class-transformer";

export class AdmissionCriterionDto {
  @ApiProperty({ example: "Điểm Toán", description: "Tên tiêu chí xét tuyển" })
  @IsString()
  @IsNotEmpty()
  criterionName: string;

  @ApiPropertyOptional({ example: 7.0, description: "Điểm tối thiểu cần đạt" })
  @IsNumber()
  @IsOptional()
  minValue?: number;

  @ApiProperty({ example: true, description: "Tiêu chí này có bắt buộc không" })
  @IsBoolean()
  @IsOptional()
  isRequired: boolean = true;

  @ApiPropertyOptional({
    example: "Xét điểm thi tốt nghiệp THPT",
    description: "Mô tả thêm về tiêu chí",
  })
  @IsString()
  @IsOptional()
  description?: string;
}

export class AdmissionItemDto {
  @ApiProperty({ example: 1, description: "ID của ngành học (Major)" })
  @IsInt()
  @IsNotEmpty()
  majorId: number;

  @ApiProperty({ example: "K18" })
  @IsString()
  @IsNotEmpty()
  batchName: string;

  @ApiProperty({
    example: 100,
    description: "Chỉ tiêu tuyển sinh cho ngành này",
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  quota: number;

  @ApiPropertyOptional({
    type: [AdmissionCriterionDto],
    description: "Danh sách các điều kiện xét tuyển riêng cho ngành",
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdmissionCriterionDto)
  @IsOptional()
  criteria?: AdmissionCriterionDto[];
}

export class CreateAdmissionDto {
  @ApiProperty({
    example: "Tuyển sinh Đợt 1 - 2026",
    description: "Tên đợt tuyển sinh",
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: "2026-05-01T00:00:00Z",
    description: "Ngày bắt đầu nhận hồ sơ",
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({
    example: "2026-08-30T00:00:00Z",
    description: "Ngày kết thúc nhận hồ sơ",
  })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiProperty({
    type: [AdmissionItemDto],
    description: "Danh sách chi tiết các ngành và chỉ tiêu",
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AdmissionItemDto)
  items: AdmissionItemDto[];
}
