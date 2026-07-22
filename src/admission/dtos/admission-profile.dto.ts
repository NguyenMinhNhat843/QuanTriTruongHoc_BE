import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  ApplicationStatus,
  AdmissionType,
  EducationLevel,
  Gender,
  Conduct,
  PriorityRegion,
  PriorityObject,
  DirectAdmissionReason,
} from "../../../prisma/generated/prisma/client.js";

export class ExamScoreDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  subjectCode: string;

  @ApiProperty()
  score: number;
}

export class CreateExamScoreDto {
  @ApiProperty()
  subjectCode: string;

  @ApiProperty()
  score: number;
}

export class TranscriptSubjectScoreDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  gradeLevel: number;

  @ApiProperty()
  subjectCode: string;

  @ApiProperty()
  score: number;
}

export class CreateTranscriptSubjectScoreDto {
  @ApiProperty()
  gradeLevel: number;

  @ApiProperty()
  subjectCode: string;

  @ApiProperty()
  score: number;
}

export class AdmissionProfileDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  applicationCode: string;

  @ApiProperty()
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

  @ApiProperty()
  dob: Date;

  @ApiProperty({ enum: Gender })
  gender: Gender;

  @ApiProperty()
  phone: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  addressDetail?: string;

  @ApiPropertyOptional()
  provinceCode?: string;

  @ApiPropertyOptional()
  wardCode?: string;

  @ApiPropertyOptional()
  villageId?: number;

  @ApiPropertyOptional()
  fatherName?: string;

  @ApiPropertyOptional()
  fatherPhone?: string;

  @ApiPropertyOptional()
  motherName?: string;

  @ApiPropertyOptional()
  motherPhone?: string;

  @ApiPropertyOptional()
  guardianName?: string;

  @ApiPropertyOptional()
  guardianPhone?: string;

  @ApiPropertyOptional()
  gpa6?: number;

  @ApiPropertyOptional()
  gpa7?: number;

  @ApiPropertyOptional()
  gpa8?: number;

  @ApiPropertyOptional()
  gpa9?: number;

  @ApiPropertyOptional({ enum: Conduct })
  conduct6?: Conduct;

  @ApiPropertyOptional({ enum: Conduct })
  conduct7?: Conduct;

  @ApiPropertyOptional({ enum: Conduct })
  conduct8?: Conduct;

  @ApiPropertyOptional({ enum: Conduct })
  conduct9?: Conduct;

  @ApiPropertyOptional()
  thcsGradYear?: number;

  @ApiPropertyOptional()
  gpa10?: number;

  @ApiPropertyOptional()
  gpa11?: number;

  @ApiPropertyOptional()
  gpa12?: number;

  @ApiPropertyOptional({ enum: Conduct })
  conduct10?: Conduct;

  @ApiPropertyOptional({ enum: Conduct })
  conduct11?: Conduct;

  @ApiPropertyOptional({ enum: Conduct })
  conduct12?: Conduct;

  @ApiPropertyOptional()
  thptGradYear?: number;

  @ApiPropertyOptional()
  subjectCombinationId?: number;

  @ApiPropertyOptional()
  totalExamScore?: number;

  @ApiPropertyOptional({ enum: PriorityRegion })
  priorityRegion?: PriorityRegion;

  @ApiPropertyOptional({ enum: PriorityObject })
  priorityObject?: PriorityObject;

  @ApiPropertyOptional()
  priorityScore?: number;

  @ApiProperty()
  isDirectAdmission: boolean;

  @ApiPropertyOptional({ enum: DirectAdmissionReason })
  directReason?: DirectAdmissionReason;

  @ApiPropertyOptional()
  scoreCalculated?: number;

  @ApiPropertyOptional()
  note?: string;

  @ApiPropertyOptional()
  studentId?: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CreateAdmissionProfileDto {
  @ApiProperty()
  admissionCampaignMajorId: number;

  @ApiPropertyOptional({ enum: AdmissionType, default: AdmissionType.ACADEMIC_TRANSCRIPT_GPA })
  admissionType?: AdmissionType;

  @ApiPropertyOptional({ enum: EducationLevel, default: EducationLevel.THCS })
  educationLevel?: EducationLevel;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  identityNumber: string;

  @ApiProperty()
  dob: Date;

  @ApiProperty({ enum: Gender })
  gender: Gender;

  @ApiProperty()
  phone: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  addressDetail?: string;

  @ApiPropertyOptional()
  provinceCode?: string;

  @ApiPropertyOptional()
  wardCode?: string;

  @ApiPropertyOptional()
  villageId?: number;

  @ApiPropertyOptional()
  fatherName?: string;

  @ApiPropertyOptional()
  fatherPhone?: string;

  @ApiPropertyOptional()
  motherName?: string;

  @ApiPropertyOptional()
  motherPhone?: string;

  @ApiPropertyOptional()
  guardianName?: string;

  @ApiPropertyOptional()
  guardianPhone?: string;

  @ApiPropertyOptional()
  gpa6?: number;

  @ApiPropertyOptional()
  gpa7?: number;

  @ApiPropertyOptional()
  gpa8?: number;

  @ApiPropertyOptional()
  gpa9?: number;

  @ApiPropertyOptional({ enum: Conduct })
  conduct6?: Conduct;

  @ApiPropertyOptional({ enum: Conduct })
  conduct7?: Conduct;

  @ApiPropertyOptional({ enum: Conduct })
  conduct8?: Conduct;

  @ApiPropertyOptional({ enum: Conduct })
  conduct9?: Conduct;

  @ApiPropertyOptional()
  thcsGradYear?: number;

  @ApiPropertyOptional()
  gpa10?: number;

  @ApiPropertyOptional()
  gpa11?: number;

  @ApiPropertyOptional()
  gpa12?: number;

  @ApiPropertyOptional({ enum: Conduct })
  conduct10?: Conduct;

  @ApiPropertyOptional({ enum: Conduct })
  conduct11?: Conduct;

  @ApiPropertyOptional({ enum: Conduct })
  conduct12?: Conduct;

  @ApiPropertyOptional()
  thptGradYear?: number;

  @ApiPropertyOptional()
  subjectCombinationId?: number;

  @ApiPropertyOptional({ type: [CreateExamScoreDto] })
  examScores?: CreateExamScoreDto[];

  @ApiPropertyOptional({ type: [CreateTranscriptSubjectScoreDto] })
  transcriptSubjectScores?: CreateTranscriptSubjectScoreDto[];

  @ApiPropertyOptional({ enum: PriorityRegion })
  priorityRegion?: PriorityRegion;

  @ApiPropertyOptional({ enum: PriorityObject })
  priorityObject?: PriorityObject;

  @ApiPropertyOptional()
  priorityScore?: number;

  @ApiPropertyOptional({ default: false })
  isDirectAdmission?: boolean;

  @ApiPropertyOptional({ enum: DirectAdmissionReason })
  directReason?: DirectAdmissionReason;

  @ApiPropertyOptional()
  note?: string;
}

export class UpdateAdmissionProfileDto {
  @ApiPropertyOptional()
  fullName?: string;

  @ApiPropertyOptional()
  identityNumber?: string;

  @ApiPropertyOptional()
  dob?: Date;

  @ApiPropertyOptional({ enum: Gender })
  gender?: Gender;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  addressDetail?: string;

  @ApiPropertyOptional()
  provinceCode?: string;

  @ApiPropertyOptional()
  wardCode?: string;

  @ApiPropertyOptional()
  villageId?: number;

  @ApiPropertyOptional()
  fatherName?: string;

  @ApiPropertyOptional()
  fatherPhone?: string;

  @ApiPropertyOptional()
  motherName?: string;

  @ApiPropertyOptional()
  motherPhone?: string;

  @ApiPropertyOptional()
  guardianName?: string;

  @ApiPropertyOptional()
  guardianPhone?: string;

  @ApiPropertyOptional()
  gpa6?: number;

  @ApiPropertyOptional()
  gpa7?: number;

  @ApiPropertyOptional()
  gpa8?: number;

  @ApiPropertyOptional()
  gpa9?: number;

  @ApiPropertyOptional({ enum: Conduct })
  conduct6?: Conduct;

  @ApiPropertyOptional({ enum: Conduct })
  conduct7?: Conduct;

  @ApiPropertyOptional({ enum: Conduct })
  conduct8?: Conduct;

  @ApiPropertyOptional({ enum: Conduct })
  conduct9?: Conduct;

  @ApiPropertyOptional()
  thcsGradYear?: number;

  @ApiPropertyOptional()
  gpa10?: number;

  @ApiPropertyOptional()
  gpa11?: number;

  @ApiPropertyOptional()
  gpa12?: number;

  @ApiPropertyOptional({ enum: Conduct })
  conduct10?: Conduct;

  @ApiPropertyOptional({ enum: Conduct })
  conduct11?: Conduct;

  @ApiPropertyOptional({ enum: Conduct })
  conduct12?: Conduct;

  @ApiPropertyOptional()
  thptGradYear?: number;

  @ApiPropertyOptional()
  subjectCombinationId?: number;

  @ApiPropertyOptional({ type: [CreateExamScoreDto] })
  examScores?: CreateExamScoreDto[];

  @ApiPropertyOptional({ type: [CreateTranscriptSubjectScoreDto] })
  transcriptSubjectScores?: CreateTranscriptSubjectScoreDto[];

  @ApiPropertyOptional({ enum: PriorityRegion })
  priorityRegion?: PriorityRegion;

  @ApiPropertyOptional({ enum: PriorityObject })
  priorityObject?: PriorityObject;

  @ApiPropertyOptional()
  priorityScore?: number;

  @ApiPropertyOptional()
  isDirectAdmission?: boolean;

  @ApiPropertyOptional({ enum: DirectAdmissionReason })
  directReason?: DirectAdmissionReason;

  @ApiPropertyOptional()
  note?: string;
}

export class SearchAdmissionProfileDto {
  @ApiPropertyOptional()
  applicationCode?: string;

  @ApiPropertyOptional()
  fullName?: string;

  @ApiPropertyOptional()
  identityNumber?: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional({ enum: ApplicationStatus })
  status?: ApplicationStatus;

  @ApiPropertyOptional()
  admissionCampaignMajorId?: number;

  @ApiPropertyOptional()
  admissionCampaignId?: number;

  @ApiPropertyOptional()
  majorId?: number;

  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 10 })
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

