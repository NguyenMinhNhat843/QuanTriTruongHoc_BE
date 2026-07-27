import { ApiProperty, ApiPropertyOptional, OmitType } from "@nestjs/swagger";
import { IsOptional, IsInt } from "class-validator";
import { PartialType } from "@nestjs/swagger";
import { Semester, SemesterStatus } from "../../prisma/generated/prisma/client";
import { Type } from "class-transformer";

export class SemesterDto implements Semester {
  @ApiProperty({ type: Number })
  @Type(() => Number)
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: String, nullable: true })
  schoolYear: string | null;

  @ApiProperty({ type: Number, nullable: true })
  academicYearId: number | null;

  @ApiProperty({ type: Number, nullable: true })
  @Type(() => Number)
  year: number | null;

  @ApiProperty({ type: Number, nullable: true })
  @Type(() => Number)
  term: number | null;

  @ApiProperty({ type: Date })
  @Type(() => Date)
  startDate: Date;

  @ApiProperty({ type: Date })
  @Type(() => Date)
  endDate: Date;

  @ApiProperty({ type: Number, nullable: true })
  @Type(() => Number)
  teachingWeeks: number | null;

  @ApiProperty({ type: Boolean })
  @Type(() => Boolean)
  isCurrent: boolean;

  @ApiProperty({ enum: SemesterStatus, nullable: true })
  status: SemesterStatus | null;

  @ApiProperty({ type: Date })
  @Type(() => Date)
  createdAt: Date;
}

// CREATE/UPDATE DTO
export class CreateSemesterDto extends OmitType(SemesterDto, ["id", "createdAt"] as const) {}
export class UpdateSemesterDto extends PartialType(CreateSemesterDto) {}

export class FindAllSemestersQueryDto {
  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  studentId?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  batchId?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  classId?: number;
}
