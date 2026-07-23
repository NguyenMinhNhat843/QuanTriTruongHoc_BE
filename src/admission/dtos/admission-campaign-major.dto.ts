import { ApiProperty, ApiPropertyOptional, OmitType, PartialType, PickType } from "@nestjs/swagger";
import { TrainingType, Conduct, AdmissionCampaignMajor } from "../../../prisma/generated/prisma/client.js";
import { MajorDto } from "../../major/major.dto.js";
import { SubjectCombinationDetailDto } from "./subject-combination.dto.js";
import { Type } from "class-transformer";

export class AdmissionCampaignMajorDto implements AdmissionCampaignMajor {
  @ApiProperty()
  @Type(() => Number)
  id: number;

  @ApiProperty()
  @Type(() => Number)
  admissionCampaignId: number;

  @ApiProperty()
  @Type(() => Number)
  majorId: number;

  @ApiProperty({ enum: TrainingType })
  trainingType: TrainingType;

  @ApiProperty()
  @Type(() => Number)
  quota: number;

  @ApiProperty()
  @Type(() => Number)
  subjectCombinationId: number;

  @ApiProperty()
  @Type(() => Number)
  batchId: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  cutoffScore: number | null;

  @ApiPropertyOptional({ enum: Conduct, type: () => Conduct })
  minConduct: Conduct | null;

  @ApiPropertyOptional({ type: Number })
  @Type(() => Number)
  minScorePerSubject: number | null;

  @ApiPropertyOptional({ type: Number })
  @Type(() => Number)
  minTotalScore: number | null;
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
