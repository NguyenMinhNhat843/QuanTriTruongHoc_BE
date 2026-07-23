import { ApiProperty, ApiPropertyOptional, OmitType, PartialType, PickType } from "@nestjs/swagger";
import { TrainingType, Conduct } from "../../../prisma/generated/prisma/client.js";
import { MajorDto } from "../../major/major.dto.js";
import { SubjectCombinationDetailDto } from "./subject-combination.dto.js";

export class AdmissionCampaignMajorDto implements AdmissionCampaignMajorDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  admissionCampaignId: number;

  @ApiProperty()
  majorId: number;

  @ApiProperty({ enum: TrainingType })
  trainingType: TrainingType;

  @ApiProperty()
  quota: number;

  @ApiProperty()
  subjectCombinationId: number;

  @ApiPropertyOptional()
  minScorePerSubject?: number;

  @ApiPropertyOptional()
  minTotalScore?: number;

  @ApiPropertyOptional({ enum: Conduct })
  minConduct?: Conduct;

  @ApiPropertyOptional()
  cutoffScore?: number;
}

export class AdmissionCampaignMajorDetailDto extends AdmissionCampaignMajorDto {
  @ApiPropertyOptional({ type: MajorDto })
  major?: MajorDto;

  @ApiPropertyOptional({ type: SubjectCombinationDetailDto })
  subjectCombination?: SubjectCombinationDetailDto;
}

// CREATE DTO
export class CreateAdmissionCampaignMajorDto extends OmitType(AdmissionCampaignMajorDto, [
  "id",
  "admissionCampaignId",
] as const) {}

// UPDATE DTO
export class UpdateAdmissionCampaignMajorDto extends PartialType(CreateAdmissionCampaignMajorDto) {}

// SEARCH DTO
export class SearchAdmissionCampaignMajorDto extends PartialType(
  PickType(AdmissionCampaignMajorDto, ["admissionCampaignId", "majorId", "trainingType"] as const),
) {
  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  limit?: number;
}
