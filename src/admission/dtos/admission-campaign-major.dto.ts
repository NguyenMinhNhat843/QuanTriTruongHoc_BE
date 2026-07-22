import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  TrainingType,
  AdmissionType,
  Conduct,
  TranscriptScoreMethod,
} from "../../../prisma/generated/prisma/client.js";

export class AdmissionCampaignMajorDto {
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

  @ApiProperty({ enum: AdmissionType, isArray: true })
  acceptedAdmissionTypes: AdmissionType[];

  @ApiPropertyOptional()
  subjectCombinationId?: number;

  @ApiPropertyOptional()
  minScorePerSubject?: number;

  @ApiPropertyOptional()
  minTotalScore?: number;

  @ApiPropertyOptional()
  minGpaAverage?: number;

  @ApiPropertyOptional({ enum: Conduct })
  minConduct?: Conduct;

  @ApiPropertyOptional({ enum: TranscriptScoreMethod })
  transcriptScoreMethod?: TranscriptScoreMethod;

  @ApiPropertyOptional()
  cutoffScore?: number;
}

export class CreateAdmissionCampaignMajorDto {
  @ApiProperty()
  admissionCampaignId: number;

  @ApiProperty()
  majorId: number;

  @ApiProperty({ enum: TrainingType })
  trainingType: TrainingType;

  @ApiProperty()
  quota: number;

  @ApiProperty({ enum: AdmissionType, isArray: true })
  acceptedAdmissionTypes: AdmissionType[];

  @ApiPropertyOptional()
  subjectCombinationId?: number;

  @ApiPropertyOptional()
  minScorePerSubject?: number;

  @ApiPropertyOptional()
  minTotalScore?: number;

  @ApiPropertyOptional()
  minGpaAverage?: number;

  @ApiPropertyOptional({ enum: Conduct })
  minConduct?: Conduct;

  @ApiPropertyOptional({ enum: TranscriptScoreMethod })
  transcriptScoreMethod?: TranscriptScoreMethod;

  @ApiPropertyOptional()
  cutoffScore?: number;
}

export class UpdateAdmissionCampaignMajorDto {
  @ApiPropertyOptional()
  quota?: number;

  @ApiPropertyOptional({ enum: AdmissionType, isArray: true })
  acceptedAdmissionTypes?: AdmissionType[];

  @ApiPropertyOptional()
  subjectCombinationId?: number;

  @ApiPropertyOptional()
  minScorePerSubject?: number;

  @ApiPropertyOptional()
  minTotalScore?: number;

  @ApiPropertyOptional()
  minGpaAverage?: number;

  @ApiPropertyOptional({ enum: Conduct })
  minConduct?: Conduct;

  @ApiPropertyOptional({ enum: TranscriptScoreMethod })
  transcriptScoreMethod?: TranscriptScoreMethod;

  @ApiPropertyOptional()
  cutoffScore?: number;
}

export class SearchAdmissionCampaignMajorDto {
  @ApiPropertyOptional()
  admissionCampaignId?: number;

  @ApiPropertyOptional()
  majorId?: number;

  @ApiPropertyOptional({ enum: TrainingType })
  trainingType?: TrainingType;

  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  limit?: number;
}

