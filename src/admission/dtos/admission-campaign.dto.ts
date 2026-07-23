import { ApiProperty, ApiPropertyOptional, OmitType, PartialType, PickType } from "@nestjs/swagger";
import { AdmissionCampaign, CampaignStatus, TrainingType } from "../../../prisma/generated/prisma/client.js";
import { AdmissionCampaignMajorDetailDto, CreateAdmissionCampaignMajorDto } from "./admission-campaign-major.dto.js";
import { AcademicYearDto } from "../../academic-year/academic-year.dto.js";
import { DocumentConfigDto } from "./document-config.dto.js";
import { Type } from "class-transformer";

export class AdmissionCampaignDto implements AdmissionCampaign {
  @ApiProperty()
  id: number;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty()
  @Type(() => Date)
  endDate: Date;

  @ApiProperty({ enum: CampaignStatus })
  status: CampaignStatus;

  @ApiProperty({ required: false, nullable: true, type: String })
  description: string | null;

  @ApiProperty()
  academicYearId: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class AdmissionCampaignDetailDto extends AdmissionCampaignDto {
  @ApiProperty({ type: AcademicYearDto })
  academicYear: AcademicYearDto;

  @ApiPropertyOptional({ type: [AdmissionCampaignMajorDetailDto] })
  campaignMajors?: AdmissionCampaignMajorDetailDto[];

  @ApiPropertyOptional({ type: [DocumentConfigDto] })
  documentConfigs?: DocumentConfigDto[];
}

// CREATE DTO
export class CreateAdmissionCampaignDto extends OmitType(AdmissionCampaignDto, [
  "id",
  "createdAt",
  "updatedAt",
] as const) {
  @ApiPropertyOptional({ type: [CreateAdmissionCampaignMajorDto] })
  campaignMajors?: CreateAdmissionCampaignMajorDto[];
}

// UPDATE DTO
export class UpdateAdmissionCampaignDto extends PartialType(CreateAdmissionCampaignDto) {}

// SEARCH DTO
export class SearchAdmissionCampaignDto extends PartialType(
  PickType(AdmissionCampaignDto, ["code", "name", "status", "academicYearId"] as const),
) {
  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  limit?: number;
}

// SEARCH ĐỢT TUYỂN SINH ĐANG ACTIVE THEO NGÀNH< HỆ ĐÀO TẠO
export class FindActiveCampaignDto {
  @ApiPropertyOptional({
    description: "ID Ngành học cần lọc",
    example: 1,
  })
  @Type(() => Number)
  majorId?: number;

  @ApiPropertyOptional({
    description: "Hệ đào tạo Trung cấp, Sơ cấp",
    enum: TrainingType,
  })
  trainingType?: TrainingType;
}

// RESPONSE PAGINATION DTO
export class ResponseAdmissionCampaignPaginationDto {
  @ApiProperty({ type: [AdmissionCampaignDetailDto] })
  data: AdmissionCampaignDetailDto[];

  @ApiProperty()
  total: number;
}
