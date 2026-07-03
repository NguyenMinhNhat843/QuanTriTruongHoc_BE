import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ClassSubjectSessionWithRelationDto } from "./classSubjectSession.dto";
import { ClassSubjectDto } from "../../courseOffer/classSubject.response";
import { SubjectDto } from "../../subject/subject.dto";
import { StaffResponseDto } from "../../staff/staff.response";

export class UpsertTrainingPlanDto {
  @ApiProperty()
  classId: number;

  @ApiProperty()
  semesterId: number;

  @ApiProperty()
  subjectId: number;

  @ApiPropertyOptional({ nullable: true })
  teacherId?: number | null;

  @ApiProperty({ type: [ClassSubjectSessionWithRelationDto] })
  sessions: ClassSubjectSessionWithRelationDto[];
}

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
