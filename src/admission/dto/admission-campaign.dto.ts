import { ApiProperty, OmitType, PartialType, PickType } from "@nestjs/swagger";
import { AdmissionCampaign, CampaignStatus } from "../../../prisma/generated/prisma/client";
import { AdmissionCampaignMajorDto, ResponseAdmissionCampaignMajorDetailDto } from "./admission-campaign-major.dto";
import { IsInt, IsNotEmpty } from "class-validator";
import { Type } from "class-transformer";
import { BatchDto } from "../../batch/batch.dto";

export class AdmissionCampaignDto implements AdmissionCampaign {
  @ApiProperty()
  id: number;

  @ApiProperty()
  academicYearId: number;

  @ApiProperty({ type: Number, nullable: true })
  batchId: number | null;

  @ApiProperty()
  code: string;

  @ApiProperty({ type: Date })
  startDate: Date;

  @ApiProperty({ type: Date })
  endDate: Date;

  @ApiProperty({ type: String, nullable: true })
  description: string | null;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: CampaignStatus })
  status: CampaignStatus;

  @ApiProperty({ type: Number, nullable: true })
  targetQuota: number | null;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}

// CREATE DTO
export class AdmissionCampaignItemsDto extends OmitType(AdmissionCampaignMajorDto, ["id", "admissionCampaignId"]) {}
export class CreateAdmissionCampaignDto extends OmitType(AdmissionCampaignDto, ["id", "createdAt", "updatedAt"]) {
  @ApiProperty({ type: [AdmissionCampaignItemsDto] })
  items: AdmissionCampaignItemsDto[];
}

export class UpdateAdmissionCampaignDto extends PartialType(CreateAdmissionCampaignDto) {}
export class SearchAdmissionCampaignDto extends PartialType(PickType(AdmissionCampaignDto, ["name", "status"])) {
  @ApiProperty()
  @Type(() => Number)
  page?: number;

  @ApiProperty()
  @Type(() => Number)
  limit?: number;
}

// XÉT DUYỆT HỌC SINH TRONG ĐƯỢT TUYỂN SINH
export class ApproveCampaignDto {
  @ApiProperty({ example: 1, description: "ID Đợt tuyển sinh cần xét duyệt" })
  @IsInt()
  @IsNotEmpty()
  admissionCampaignId: number;
}

// RESPONSE TYPE
export class ResponseAdmissionCampaignPaginationPaginationDto {
  @ApiProperty({ type: [AdmissionCampaignDto] })
  data: AdmissionCampaignDto[];

  @ApiProperty({ type: Number })
  total: number;
}

// RESPONSE DETAIL: Response chi tiết với các mối quan hệ
export class ResponseAdmissionCampaignDetailDto extends AdmissionCampaignDto {
  @ApiProperty({ type: BatchDto, nullable: true })
  batch?: BatchDto;

  @ApiProperty({ type: [ResponseAdmissionCampaignMajorDetailDto], nullable: true })
  campaignMajors?: ResponseAdmissionCampaignMajorDetailDto[];
}
