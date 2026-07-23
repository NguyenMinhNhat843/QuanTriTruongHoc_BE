import { ApiProperty, ApiPropertyOptional, OmitType, PartialType, PickType } from "@nestjs/swagger";
import {
  ApplicationStatus,
  AdmissionType,
  EducationLevel,
  Gender,
  Conduct,
  PriorityRegion,
  PriorityObject,
  DirectAdmissionReason,
  AdmissionProfile,
} from "../../../prisma/generated/prisma/client.js";
import { CreateExamScoreDto, ExamScoreDto } from "./exam-score.dto.js";
import { CreateTranscriptSubjectScoreDto, TranscriptSubjectScoreDto } from "./transcript-subject-score.dto.js";
import { Type } from "class-transformer";
import { AdmissionCampaignDetailDto } from "./admission-campaign.dto.js";
import { AdmissionDocumentDto } from "./admission-document.dto.js";
import { AdmissionStatusLogDto } from "./admission-status-log.dto.js";

export class AdmissionProfileDto implements AdmissionProfile {
  @ApiProperty()
  @Type(() => Number)
  id: number;

  @ApiProperty()
  applicationCode: string;

  @ApiProperty()
  @Type(() => Number)
  admissionCampaignMajorId: number;

  @ApiProperty({ enum: ApplicationStatus })
  status: ApplicationStatus;

  @ApiProperty({ enum: AdmissionType })
  admissionType: AdmissionType;

  @ApiProperty({ enum: EducationLevel })
  educationLevel: EducationLevel;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  identityNumber: string;

  @ApiProperty({ type: Date })
  @Type(() => Date)
  dob: Date;

  @ApiProperty({ enum: Gender })
  gender: Gender;

  @ApiProperty()
  phone: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  email: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  addressDetail: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  provinceCode: string | null;

  @ApiPropertyOptional({ enum: Conduct, nullable: true })
  conduct10: Conduct | null;

  @ApiPropertyOptional({ enum: Conduct, nullable: true })
  conduct11: Conduct | null;

  @ApiPropertyOptional({ enum: Conduct, nullable: true })
  conduct12: Conduct | null;

  @ApiPropertyOptional({ enum: Conduct, nullable: true })
  conduct6: Conduct | null;

  @ApiPropertyOptional({ enum: Conduct, nullable: true })
  conduct7: Conduct | null;

  @ApiPropertyOptional({ enum: Conduct, nullable: true })
  conduct8: Conduct | null;

  @ApiPropertyOptional({ enum: Conduct, nullable: true })
  conduct9: Conduct | null;

  @ApiPropertyOptional({ enum: DirectAdmissionReason, nullable: true })
  directReason: DirectAdmissionReason | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  fatherName: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  fatherPhone: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @Type(() => Number)
  gpa10: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @Type(() => Number)
  gpa11: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @Type(() => Number)
  gpa12: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @Type(() => Number)
  gpa6: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @Type(() => Number)
  gpa7: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @Type(() => Number)
  gpa8: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @Type(() => Number)
  gpa9: number | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  guardianName: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  guardianPhone: string | null;

  @ApiProperty()
  @Type(() => Boolean)
  isDirectAdmission: boolean;

  @ApiPropertyOptional({ type: String, nullable: true })
  motherName: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  motherPhone: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  note: string | null;

  @ApiPropertyOptional({ enum: PriorityObject, nullable: true })
  priorityObject: PriorityObject | null;

  @ApiPropertyOptional({ enum: PriorityRegion, nullable: true })
  priorityRegion: PriorityRegion | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @Type(() => Number)
  priorityScore: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @Type(() => Number)
  scoreCalculated: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @Type(() => Number)
  studentId: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @Type(() => Number)
  subjectCombinationId: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @Type(() => Number)
  thcsGradYear: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @Type(() => Number)
  thptGradYear: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @Type(() => Number)
  totalExamScore: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @Type(() => Number)
  villageId: number | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  wardCode: string | null;

  @ApiProperty({ type: Date })
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty({ type: Date })
  @Type(() => Date)
  updatedAt: Date;
}

export class AdmissionProfileDetailDto {
  @ApiProperty({ type: () => AdmissionProfileDto })
  profile: AdmissionProfileDto;

  @ApiPropertyOptional({ type: () => AdmissionCampaignDetailDto })
  admissionCampaign?: AdmissionCampaignDetailDto;

  @ApiProperty({ type: () => [ExamScoreDto] })
  examScores: ExamScoreDto[];

  @ApiProperty({ type: () => [TranscriptSubjectScoreDto] })
  transcriptSubjectScores: TranscriptSubjectScoreDto[];

  @ApiProperty({ type: () => [AdmissionDocumentDto] })
  documents: AdmissionDocumentDto[];

  @ApiProperty({ type: () => [AdmissionStatusLogDto] })
  statusLogs: AdmissionStatusLogDto[];
}

export class CreateAdmissionProfileDto extends OmitType(AdmissionProfileDto, ["id", "createdAt", "updatedAt"]) {
  @ApiProperty({ type: [CreateExamScoreDto] })
  examScores: CreateExamScoreDto[];

  @ApiProperty({ type: [CreateTranscriptSubjectScoreDto] })
  transcriptSubjectScores: CreateTranscriptSubjectScoreDto[];
}

export class UpdateAdmissionProfileDto extends PartialType(CreateAdmissionProfileDto) {}

export class SearchAdmissionProfileDto extends PartialType(
  PickType(AdmissionProfileDto, [
    "applicationCode",
    "fullName",
    "identityNumber",
    "phone",
    "status",
    "admissionCampaignMajorId",
    "admissionType",
  ] as const),
) {
  @ApiPropertyOptional()
  @Type(() => Number)
  admissionCampaignId?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  majorId?: number;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  @Type(() => Number)
  limit?: number;
}

export class ChangeProfileStatusDto {
  @ApiProperty({ enum: ApplicationStatus })
  status: ApplicationStatus;

  @ApiPropertyOptional()
  reason?: string;
}

export class ResponseAdmissionProfilePaginationDto {
  @ApiProperty({ type: [AdmissionProfileDto] })
  data: AdmissionProfileDto[];

  @ApiProperty()
  total: number;
}
