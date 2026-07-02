import { ApiProperty } from "@nestjs/swagger";
import { ScheduleDto } from "../../schedule/studySchedule.dto";
import { SubjectDto } from "../../subject/subject.dto";
import { ClassSubjectDto } from "../classSubject.response";

export class ResponseTrainingProgressDto {
  @ApiProperty({ type: () => ClassSubjectDto })
  classSubject: ClassSubjectDto;

  @ApiProperty({ type: () => SubjectDto })
  subject: SubjectDto;

  @ApiProperty({ type: () => [ScheduleDto] })
  schedules: ScheduleDto[];
}
