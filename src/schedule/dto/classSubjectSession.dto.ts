import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from "@nestjs/swagger";
import {
  ClassSubjectSession,
  DayOfWeek,
} from "../../../prisma/generated/prisma/client";
import { ClassSubjectScheduleDetailDto } from "./classSubjectScheduleDetail";
import { RoomDto } from "../../room/room.dto";

export class ClassSubjectSessionDto implements ClassSubjectSession {
  @ApiProperty()
  id: number;

  @ApiProperty()
  classSubjectId: number;

  @ApiPropertyOptional({ nullable: true })
  roomId: number | null;

  @ApiPropertyOptional({ nullable: true })
  countPeriod: number | null;

  @ApiProperty({ enum: DayOfWeek })
  dayOfWeek: DayOfWeek;

  @ApiProperty()
  endPeriod: number;

  @ApiProperty()
  shift: string;

  @ApiProperty()
  startPeriod: number;
}

export class ClassSubjectSessionWithRelationDto extends ClassSubjectSessionDto {
  @ApiProperty({ type: [ClassSubjectScheduleDetailDto] })
  schedules?: ClassSubjectScheduleDetailDto[];

  @ApiProperty({ type: () => RoomDto })
  room?: RoomDto;
}

export class CreateClassSubjectSessionDto extends OmitType(
  ClassSubjectSessionDto,
  ["id"],
) {}
export class UpdateClassSubjectSessionDto extends PartialType(
  CreateClassSubjectSessionDto,
) {}
export class SearchClassSubjectSessionDto extends PartialType(
  ClassSubjectSessionDto,
) {}
