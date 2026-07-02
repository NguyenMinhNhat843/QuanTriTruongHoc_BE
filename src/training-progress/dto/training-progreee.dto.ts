import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsInstance, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { CreateClassSubjectDto } from "../../courseOffer/dto/classSubject.dto";
import {
  CreateStudyScheduleDto,
  ScheduleDto,
} from "../../schedule/studySchedule.dto";
import { ClassSubjectDto } from "../../courseOffer/classSubject.response";
import { SubjectDto } from "../../subject/subject.dto";

export class CreateTrainingProgressDto {
  @ApiProperty({ type: CreateStudyScheduleDto, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStudyScheduleDto)
  schedulesItems: CreateStudyScheduleDto[];

  @ApiProperty({ type: CreateClassSubjectDto, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateClassSubjectDto)
  classSubjects: CreateClassSubjectDto[];
}

export class ResponseTrainingProgressDto {
  @ApiProperty({ type: ClassSubjectDto })
  @IsInstance(ClassSubjectDto)
  @ValidateNested()
  @Type(() => ClassSubjectDto)
  classSubject: ClassSubjectDto;

  @ApiProperty({ type: ScheduleDto, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleDto)
  schedulesItems: ScheduleDto[];

  @ApiProperty({ type: SubjectDto })
  @IsInstance(SubjectDto)
  @ValidateNested()
  @Type(() => SubjectDto)
  subject: SubjectDto;
}
