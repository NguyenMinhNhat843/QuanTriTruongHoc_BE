import { ApiProperty, OmitType, PartialType, PickType } from "@nestjs/swagger";
import {
  AdmissionProfile,
  ApplicationStatus,
  AdmissionType,
  EducationLevel,
  TrainingType,
  Gender,
  Conduct,
  PriorityRegion,
  PriorityObject,
  DirectAdmissionReason,
} from "../../../prisma/generated/prisma/client";

export class AdmissionProfileDto implements AdmissionProfile {
  @ApiProperty()
  id: number;

  @ApiProperty()
  applicationCode: string;

  @ApiProperty()
  admissionCampaignId: number;

  @ApiProperty()
  majorId: number;

  @ApiProperty({ enum: ApplicationStatus, default: ApplicationStatus.REGISTERED })
  status: ApplicationStatus;

  @ApiProperty({ enum: AdmissionType, default: AdmissionType.ACADEMIC_TRANSCRIPT })
  admissionType: AdmissionType;

  @ApiProperty({ enum: EducationLevel, default: EducationLevel.THCS })
  educationLevel: EducationLevel;

  @ApiProperty({ enum: TrainingType, default: TrainingType.VOCATIONAL_INTERMEDIATE })
  trainingType: TrainingType;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  identityNumber: string;

  @ApiProperty({ type: Date })
  dob: Date;

  @ApiProperty({ enum: Gender })
  gender: Gender;

  @ApiProperty()
  phone: string;

  @ApiProperty({ type: String, nullable: true })
  email: string | null;

  @ApiProperty({ type: String, nullable: true })
  addressDetail: string | null;

  @ApiProperty({ type: String, nullable: true })
  provinceCode: string | null;

  @ApiProperty({ type: String, nullable: true })
  wardCode: string | null;

  @ApiProperty({ type: Number, nullable: true })
  villageId: number | null;

  // --- Phụ huynh / Người giám hộ ---
  @ApiProperty({ type: String, nullable: true })
  fatherName: string | null;

  @ApiProperty({ type: String, nullable: true })
  fatherPhone: string | null;

  @ApiProperty({ type: String, nullable: true })
  motherName: string | null;

  @ApiProperty({ type: String, nullable: true })
  motherPhone: string | null;

  @ApiProperty({ type: String, nullable: true })
  guardianName: string | null;

  @ApiProperty({ type: String, nullable: true })
  guardianPhone: string | null;

  // --- Học bạ THCS ---
  @ApiProperty({ type: Number, nullable: true })
  gpa6: number | null;

  @ApiProperty({ type: Number, nullable: true })
  gpa7: number | null;

  @ApiProperty({ type: Number, nullable: true })
  gpa8: number | null;

  @ApiProperty({ type: Number, nullable: true })
  gpa9: number | null;

  @ApiProperty({ enum: Conduct, nullable: true })
  conduct6: Conduct | null;

  @ApiProperty({ enum: Conduct, nullable: true })
  conduct7: Conduct | null;

  @ApiProperty({ enum: Conduct, nullable: true })
  conduct8: Conduct | null;

  @ApiProperty({ enum: Conduct, nullable: true })
  conduct9: Conduct | null;

  @ApiProperty({ type: Number, nullable: true })
  thcsGradYear: number | null;

  // --- Học bạ THPT ---
  @ApiProperty({ type: Number, nullable: true })
  gpa10: number | null;

  @ApiProperty({ type: Number, nullable: true })
  gpa11: number | null;

  @ApiProperty({ type: Number, nullable: true })
  gpa12: number | null;

  @ApiProperty({ type: Number, nullable: true })
  thptGradYear: number | null;

  // --- Điểm thi & Ưu tiên ---
  @ApiProperty({ type: Number, nullable: true })
  totalExamScore: number | null;

  @ApiProperty({ enum: PriorityRegion, nullable: true })
  priorityRegion: PriorityRegion | null;

  @ApiProperty({ enum: PriorityObject, nullable: true, default: PriorityObject.NONE })
  priorityObject: PriorityObject | null;

  @ApiProperty({ type: Number, nullable: true, default: 0 })
  priorityScore: number | null;

  // --- Tuyển thẳng ---
  @ApiProperty({ default: false })
  isDirectAdmission: boolean;

  @ApiProperty({ enum: DirectAdmissionReason, nullable: true })
  directReason: DirectAdmissionReason | null;

  @ApiProperty({ type: Number, nullable: true })
  scoreCalculated: number | null;

  @ApiProperty({ type: String, nullable: true })
  note: string | null;

  @ApiProperty({ type: Number, nullable: true })
  studentId: number | null;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}

// CREATE DTO: Bỏ các trường hệ thống tự sinh (id, applicationCode, createdAt, updatedAt)
export class CreateAdmissionProfileDto extends OmitType(AdmissionProfileDto, [
  "id",
  "applicationCode",
  "createdAt",
  "updatedAt",
]) {}

// UPDATE DTO: Cho phép cập nhật từng trường của CreateDto
export class UpdateAdmissionProfileDto extends PartialType(CreateAdmissionProfileDto) {}

// SEARCH DTO: Tìm kiếm theo các thông tin nhận diện cốt lõi
export class SearchAdmissionProfileDto extends PartialType(
  PickType(AdmissionProfileDto, [
    "applicationCode",
    "fullName",
    "identityNumber",
    "phone",
    "status",
    "admissionCampaignId",
    "majorId",
  ]),
) {
  @ApiProperty({ type: Number, required: false, default: 1 })
  page: number;

  @ApiProperty({ type: Number, required: false, default: 10 })
  limit: number;
}

// RESPONSE PAGINATION DTO
export class ResponseAdmissionProfilePaginationDto {
  @ApiProperty({ type: [AdmissionProfileDto] })
  data: AdmissionProfileDto[];

  @ApiProperty({ type: Number })
  total: number;
}
