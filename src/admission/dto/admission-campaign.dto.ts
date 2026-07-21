import { ApiProperty, OmitType, PartialType, PickType } from "@nestjs/swagger";
import { AdmissionCampaign, CampaignStatus } from "../../../prisma/generated/prisma/client";
import { AdmissionCampaignMajorDto } from "./admission-campaign-major.dto";

export class AdmissionCampaignDto implements AdmissionCampaign {
  @ApiProperty()
  id: number;

  @ApiProperty({ example: "2024-2025" })
  academicYear: string;

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
export class SearchAdmissionCampaignDto extends PickType(AdmissionCampaignDto, ["name", "status"]) {}

// RESPONSE TYPE
export class ResponseAdmissionCampaignPaginationPaginationDto {
  @ApiProperty({ type: [AdmissionCampaignDto] })
  data: AdmissionCampaignDto[];

  @ApiProperty({ type: Number })
  total: number;
}
