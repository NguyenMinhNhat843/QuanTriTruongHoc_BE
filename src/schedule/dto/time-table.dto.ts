import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional } from "class-validator";

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

export class GetWeeklyScheduleQueryDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  weekNumber: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  semesterId?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  classId?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  studentId?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  teacherId?: number;
}

export class WeeklyScheduleResponseDto {
  @ApiProperty()
  scheduleId: number;

  @ApiProperty()
  weekNumber: number;

  @ApiProperty()
  studyDate: Date;

  @ApiProperty()
  dayOfWeek: string;

  @ApiProperty()
  subjectId: number;

  @ApiProperty()
  subjectCode: string;

  @ApiProperty()
  subjectName: string;

  @ApiProperty()
  credits: number;

  @ApiProperty({ nullable: true })
  classId: number | null;

  @ApiProperty()
  className: string;

  @ApiProperty({ nullable: true })
  teacherId: number | null;

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

  @ApiProperty({ nullable: true })
  roomId: number | null;

  @ApiProperty()
  roomCode: string;

  @ApiProperty({ nullable: true })
  building: string | null;

  @ApiProperty()
  isRoomOverridden: boolean;
}
