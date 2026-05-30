import { ApiProperty, OmitType } from "@nestjs/swagger";
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
}

export class CreateStudyScheduleDto extends OmitType(ScheduleDto, ["id"]) {}
