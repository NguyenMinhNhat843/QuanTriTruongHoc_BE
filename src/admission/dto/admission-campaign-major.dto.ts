import { ApiProperty, OmitType, PartialType, PickType } from "@nestjs/swagger";
import { AdmissionCampaignMajor } from "../../../prisma/generated/prisma/client";
import { MajorDto } from "../../major/major.dto";

export class AdmissionCampaignMajorDto implements AdmissionCampaignMajor {
  @ApiProperty()
  id: number;

  @ApiProperty()
  admissionCampaignId: number;

  @ApiProperty()
  majorId: number;

  @ApiProperty()
  quota: number;

  @ApiProperty({ type: Number, nullable: true })
  benchmarkScore: number | null;
}

// CREATE DTO
export class CreateAdmissionCampaignMajorDto extends OmitType(AdmissionCampaignMajorDto, ["id"]) {}

// UPDATE DTO
export class UpdateAdmissionCampaignMajorDto extends PartialType(CreateAdmissionCampaignMajorDto) {}

// SEARCH DTO
export class SearchAdmissionCampaignMajorDto extends PartialType(
  PickType(AdmissionCampaignMajorDto, ["admissionCampaignId", "majorId"]),
) {}

// RESPONSE TYPE (PAGINATION)
export class ResponseAdmissionCampaignMajorPaginationDto {
  @ApiProperty({ type: [AdmissionCampaignMajorDto] })
  data: AdmissionCampaignMajorDto[];

  @ApiProperty({ type: Number })
  total: number;
}

// RESPONSE DETAIL: Response chi tiết với các mối quan hệ
export class ResponseAdmissionCampaignMajorDetailDto extends AdmissionCampaignMajorDto {
  @ApiProperty({ type: MajorDto, nullable: true })
  major?: MajorDto;
}
