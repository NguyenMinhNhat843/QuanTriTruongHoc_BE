import { ApiProperty, ApiPropertyOptional, OmitType } from "@nestjs/swagger";
import {
  ClassSubjectSessionDto,
  ClassSubjectSessionWithRelationDto,
} from "./classSubjectSession.dto";
import { ClassSubjectDto } from "../../courseOffer/classSubject.response";
import { SubjectDto } from "../../subject/subject.dto";
import { StaffResponseDto } from "../../staff/staff.response";
import { ClassSubjectScheduleDetailDto } from "./classSubjectScheduleDetail";

// Payload cho api upsert training plan với danh sách classSubject có nhiều session, 1 sesion có nhiều schedules
export class SchedulesPayload extends OmitType(ClassSubjectScheduleDetailDto, [
  "id",
  "sessionId",
]) {}

export class SessionPayload extends OmitType(ClassSubjectSessionDto, [
  "id",
  "classSubjectId",
]) {
  @ApiProperty({ type: [SchedulesPayload] })
  schedules: SchedulesPayload[];
}

export class UpsertTrainingPlanDtoItem {
  @ApiProperty()
  subjectId: number;

  @ApiPropertyOptional({ nullable: true })
  teacherId?: number | null;

  @ApiProperty({ type: [SessionPayload] })
  sessions: SessionPayload[];
}

export class UpsertTrainingPlanDto {
  @ApiProperty()
  classId: number;

  @ApiProperty()
  semesterId: number;

  @ApiProperty({ type: [UpsertTrainingPlanDtoItem] })
  items: UpsertTrainingPlanDtoItem[];
}
// =======

export class ResponseTrainingProgress {
  @ApiProperty({ type: () => ClassSubjectDto })
  classSubject: ClassSubjectDto | null;

  @ApiProperty({ type: () => SubjectDto })
  subject: SubjectDto | null;

  @ApiProperty({ type: () => StaffResponseDto })
  teacher: StaffResponseDto | null;

  @ApiProperty({ type: () => [ClassSubjectSessionWithRelationDto] })
  classSubjectSessions: ClassSubjectSessionWithRelationDto[];
}
