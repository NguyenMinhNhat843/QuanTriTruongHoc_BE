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
  IsEnum,
} from "class-validator";
import { Type } from "class-transformer";
import { AdmissionStatus } from "../../prisma/generated/prisma/enums";

// Tiêu chí tuyển sinh
export enum CriterionType {
  NUMBER = "NUMBER",
  STRING = "STRING",
  BOOLEAN = "BOOLEAN",
}

export class CreateCriterionDto {
  @ApiProperty({
    example: "Điểm IELTS",
    description: "Tên của tiêu chí tuyển sinh",
  })
  @IsString()
  @IsNotEmpty({ message: "Tên tiêu chí không được để trống" })
  criterionName: string;

  @ApiProperty({
    enum: CriterionType,
    example: CriterionType.NUMBER,
    description: "Loại dữ liệu của tiêu chí",
  })
  @IsEnum(CriterionType, {
    message: "Loại dữ liệu phải là NUMBER, STRING hoặc BOOLEAN",
  })
  type: string;

  @ApiPropertyOptional({
    example: "Yêu cầu chứng chỉ IELTS quốc tế còn thời hạn",
    description: "Mô tả chi tiết về tiêu chí",
  })
  @IsString()
  @IsOptional()
  description?: string;
}

// Điều kiện xét tuyển cho từng ngành trong đợt tuyển sinh, bảng trung gian AdmissionItemCriterion
export class CreateAdmissionItemCriterionDto {
  @ApiProperty({
    example: 1,
    description: "ID của tiêu chí mẫu (Criterion ID)",
  })
  @IsInt()
  @Min(1)
  criterionId: number;

  @ApiPropertyOptional({
    example: 6.5,
    description: "Giá trị tối thiểu yêu cầu",
  })
  @IsNumber()
  @IsOptional()
  minValue?: number;

  @ApiProperty({
    example: true,
    description: "Tiêu chí này có bắt buộc không?",
  })
  @IsBoolean()
  @IsOptional()
  isRequired: boolean = true;

  @ApiPropertyOptional({
    example: 1.5,
    description: "Hệ số/Trọng số của tiêu chí",
  })
  @IsNumber()
  @IsOptional()
  weight?: number;
}

// Chi tiết tuyển sinh theo ngành
export class CreateAdmissionItemDto {
  @ApiProperty({ example: 1, description: "ID của ngành học" })
  @IsInt()
  @Min(1)
  majorId: number;

  @ApiProperty({ example: "K18", description: "Tên khóa/bậc tuyển sinh" })
  @IsString()
  @IsNotEmpty()
  batchName: string;

  @ApiProperty({ example: 100, description: "Chỉ tiêu số lượng sinh viên" })
  @IsInt()
  @Min(1)
  quota: number;

  @ApiProperty({
    type: [CreateAdmissionItemCriterionDto],
    description: "Danh sách các tiêu chí áp dụng cho ngành này",
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAdmissionItemCriterionDto)
  criteria: CreateAdmissionItemCriterionDto[];
}

// Đợt tuyển sinh
export class CreateAdmissionDto {
  @ApiProperty({
    example: "Tuyển sinh Đợt 1 - 2026",
    description: "Tên đợt tuyển sinh",
  })
  @IsString()
  @IsNotEmpty({ message: "Tên đợt tuyển sinh không được để trống" })
  name: string;

  @ApiProperty({
    example: "2026-05-01T00:00:00Z",
    description: "Ngày bắt đầu nhận hồ sơ",
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    example: "2026-08-31T23:59:59Z",
    description: "Ngày kết thúc nhận hồ sơ",
  })
  @IsDateString()
  endDate: string;

  @ApiProperty({
    enum: AdmissionStatus,
    default: AdmissionStatus.OPEN,
    description: "Trạng thái đợt tuyển sinh",
  })
  @IsEnum(AdmissionStatus)
  status: AdmissionStatus = AdmissionStatus.OPEN;

  @ApiProperty({
    type: [CreateAdmissionItemDto],
    description: "Danh sách các ngành và chỉ tiêu trong đợt này",
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAdmissionItemDto)
  items: CreateAdmissionItemDto[];
}

// chốt đợt Xét tuyển
export class ApproveAdmissionDto {
  @ApiProperty({
    example: 1,
    description: "ID của đợt xét tuyển cần duyệt",
  })
  @IsInt()
  @IsNotEmpty()
  admissionId: number;
}
