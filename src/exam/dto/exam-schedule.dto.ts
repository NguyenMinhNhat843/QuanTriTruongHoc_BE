import { ApiProperty, OmitType, PartialType, PickType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ExamSchedule } from "../../../prisma/generated/prisma/client";
import { ClassSubjectDto } from "../../courseOffer/dto/classSubject.dto";
import { RoomDto } from "../../room/room.dto";
import { StudentExamDetailDetailDto } from "./student-exam-detail.dto";
import { IsNotEmpty, IsNumber } from "class-validator";
import { SubjectDto } from "../../subject/dto/subject.dto";
import { ClassDto } from "../../class/class.dto";

export class ExamScheduleDto implements ExamSchedule {
  @ApiProperty()
  @Type(() => Number)
  id: number;

  @ApiProperty()
  @Type(() => Number)
  classSubjectId: number;

  @ApiProperty()
  @Type(() => Date)
  examDate: Date;

  @ApiProperty()
  @Type(() => Number)
  examTurn: number;

  @ApiProperty({ type: String, nullable: true })
  startTime: string | null;

  @ApiProperty({ type: String, nullable: true })
  endTime: string | null;

  @ApiProperty({ type: String, nullable: true })
  shift: string | null;

  @ApiProperty({ type: Number, nullable: true })
  @Type(() => Number)
  roomId: number | null;

  @ApiProperty({ type: String, nullable: true })
  note: string | null;

  @ApiProperty()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty()
  @Type(() => Date)
  updatedAt: Date;
}

// RESPONSE DETAIL DTO
class NestedClassSubjectForExamScheduleDto extends ClassSubjectDto {
  @ApiProperty({ type: SubjectDto, nullable: true })
  subject?: SubjectDto;

  @ApiProperty({ type: ClassDto, nullable: true })
  baseClass?: ClassDto;
}
export class ExamScheduleDetailDto extends ExamScheduleDto {
  @ApiProperty({ type: NestedClassSubjectForExamScheduleDto, nullable: true })
  classSubject?: NestedClassSubjectForExamScheduleDto;

  @ApiProperty({ type: RoomDto, nullable: true })
  room?: RoomDto;

  @ApiProperty({ type: [StudentExamDetailDetailDto], nullable: true })
  studentExams?: StudentExamDetailDetailDto[];
}

export class ExamSchedulePaginationDto {
  @ApiProperty({ type: [ExamScheduleDetailDto] })
  data: ExamScheduleDetailDto[];

  @ApiProperty()
  total: number;
}

// CREATE DTO
export class CreateExamScheduleDto extends OmitType(ExamScheduleDto, ["id", "createdAt", "updatedAt"] as const) {}

// UPDATE DTO
export class UpdateExamScheduleDto extends PartialType(CreateExamScheduleDto) {}

// SEARCH DTO
export class SearchExamScheduleDto extends PartialType(
  PickType(ExamScheduleDto, ["classSubjectId", "examDate", "examTurn", "shift", "roomId"] as const),
) {
  @ApiProperty()
  @Type(() => Number)
  page?: number;

  @ApiProperty()
  @Type(() => Number)
  limit?: number;
}

// THÊM 1 HỌC SINH THỦ CÔNG VÔ ĐỢT THI
export class AddStudentToExamDto {
  @ApiProperty({ description: "ID của Lịch thi / Đợt thi", example: 1 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  examScheduleId: number;

  @ApiProperty({ description: "ID của Sinh viên", example: 10 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  studentId: number;
}
