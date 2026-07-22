import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { CampaignStatus } from "../../../prisma/generated/prisma/client.js";
import { CreateAdmissionCampaignMajorDto } from "./admission-campaign-major.dto.js";

export class AdmissionCampaignDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty({ enum: CampaignStatus })
  status: CampaignStatus;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  academicYearId: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CreateAdmissionCampaignDto {
  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiPropertyOptional({ enum: CampaignStatus, default: CampaignStatus.PLANNING })
  status?: CampaignStatus;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  academicYearId: number;

  @ApiPropertyOptional({ type: [CreateAdmissionCampaignMajorDto] })
  campaignMajors?: CreateAdmissionCampaignMajorDto[];
}

export class UpdateAdmissionCampaignDto {
  @ApiPropertyOptional()
  code?: string;

  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional()
  startDate?: Date;

  @ApiPropertyOptional()
  endDate?: Date;

  @ApiPropertyOptional({ enum: CampaignStatus })
  status?: CampaignStatus;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  academicYearId?: number;

  @ApiPropertyOptional({ type: [CreateAdmissionCampaignMajorDto] })
  campaignMajors?: CreateAdmissionCampaignMajorDto[];
}

export class SearchAdmissionCampaignDto {
  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional({ enum: CampaignStatus })
  status?: CampaignStatus;

  @ApiPropertyOptional()
  academicYearId?: number;

  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  limit?: number;
}

export class ResponseAdmissionCampaignPaginationDto {
  @ApiProperty({ type: [AdmissionCampaignDto] })
  data: AdmissionCampaignDto[];

  @ApiProperty()
  total: number;
}

