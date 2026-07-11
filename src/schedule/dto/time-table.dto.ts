import { ApiProperty } from "@nestjs/swagger";

export class TodayScheduleItemDto {
  @ApiProperty()
  scheduleId: number;

  @ApiProperty()
  weekNumber: number;

  @ApiProperty()
  studyDate: Date;

  @ApiProperty()
  subjectCode: string;

  @ApiProperty()
  subjectName: string;

  @ApiProperty()
  credits: number;

  @ApiProperty()
  teacherName: string;

  @ApiProperty()
  shift: string;

  @ApiProperty()
  startPeriod: number;

  @ApiProperty()
  endPeriod: number;

  @ApiProperty()
  countPeriod: number;

  @ApiProperty()
  roomCode: string;

  @ApiProperty({ type: String, nullable: true })
  building: string | null;

  @ApiProperty()
  isRoomOverridden: boolean;
}
