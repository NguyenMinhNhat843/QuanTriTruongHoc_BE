import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsInt,
  IsObject,
  IsOptional,
  IsEnum,
  IsNumber,
} from "class-validator";
import { ApplycationAdmissionStatus } from "../../prisma/generated/prisma/enums";
import { Type } from "class-transformer";

export class CreateApplyApplicationDto {
  @ApiProperty({ example: "Nguyễn Văn A" })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: "nguyenvana@gmail.com" })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: "0905123456" })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    example: 10,
    description: "ID của AdmissionItem (Ngành muốn thi vào)",
  })
  @IsInt()
  @IsNotEmpty()
  admissionItemId: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  admissionId?: number;

  @ApiProperty({
    example: { math_score: 8.5, english_score: 7.0, ielts: 6.5 },
    description: "Dữ liệu điểm số/chứng chỉ dạng JSON",
  })
  @IsObject()
  @IsOptional()
  rawdata: any;
}

export class UpdateApplicationDto extends PartialType(
  CreateApplyApplicationDto,
) {
  @ApiPropertyOptional({
    enum: ApplycationAdmissionStatus,
    example: ApplycationAdmissionStatus.ADMITTED,
    description:
      "Trạng thái hồ sơ: PENDING, QUALIFIED, ADMITTED, REJECTED, ENROLLED",
  })
  @IsOptional()
  @IsEnum(ApplycationAdmissionStatus)
  status?: ApplycationAdmissionStatus;
}

export class FindApplicationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  skip?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  take?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(ApplycationAdmissionStatus)
  status?: ApplycationAdmissionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  admissionId?: number;
}
