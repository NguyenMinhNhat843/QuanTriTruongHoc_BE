import { ApiProperty, ApiPropertyOptional, OmitType } from "@nestjs/swagger";
import {
  ClassSubjectSchedule,
  DayOfWeek,
} from "../../prisma/generated/prisma/client";
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { Type } from "class-transformer";
import { ClassSubjectResponseDto } from "../courseOffer/classSubject.response";

export class ScheduleDto implements ClassSubjectSchedule {
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  id: number;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  classSubjectId: number;

  @ApiProperty({ enum: DayOfWeek })
  @IsEnum(DayOfWeek)
  @IsNotEmpty()
  dayOfWeek: DayOfWeek;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  weekNumber: number;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  endPeriod: number;

  @ApiProperty({ type: Number, nullable: true })
  @IsInt()
  @IsOptional()
  roomId: number | null;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  shift: string;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  startPeriod: number;

  @ApiProperty({ type: Number, nullable: true })
  @IsInt()
  @IsOptional()
  countPeriod: number | null;

  @ApiPropertyOptional({ type: Date, nullable: true })
  @Type(() => Date)
  @IsOptional()
  studyDate: Date | null;
}
export class StudyScheduleResponseDto extends ScheduleDto {
  @ApiPropertyOptional({ type: ClassSubjectResponseDto })
  classSubject?: ClassSubjectResponseDto;
}

export class CreateStudyScheduleDto extends OmitType(ScheduleDto, ["id"]) {}
export class SearchStudyScheduleDto {
  @ApiPropertyOptional({ type: Number })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  classId?: number;

  @ApiPropertyOptional({ type: Number })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  teacherId?: number;

  @ApiPropertyOptional({ type: Number })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  semesterId?: number;

  @ApiPropertyOptional({ type: Number })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  weekNumber?: number;

  @ApiPropertyOptional({ type: Date })
  @Type(() => Date)
  @IsOptional()
  startDate?: Date;
}
