import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsOptional, IsDate } from "class-validator";
import { CourseOffer } from "../../../prisma/generated/prisma/client";
import { ClassResponseDto } from "../../class/class.response";
import { StaffResponseDto } from "../../staff/staff.response";
import { SemesterResponseDto } from "../../semester/semester.response";
import { ResponseSubjectDto } from "../../subject/dto/subject.dto";

export class ClassSubjectDto implements CourseOffer {
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  id: number;

  @ApiProperty({ type: Number, nullable: true })
  @IsInt()
  @IsOptional()
  teacherId: number | null;

  @ApiProperty({ type: Number, nullable: true })
  @IsInt()
  @IsOptional()
  classId: number | null;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  semesterId: number;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  subjectId: number;

  @ApiProperty()
  @IsDate()
  @IsNotEmpty()
  createdAt: Date;

  @ApiProperty()
  @IsDate()
  @IsNotEmpty()
  updatedAt: Date;
}

export class ClassSubjectResponseDto extends ClassSubjectDto {
  @ApiPropertyOptional({ type: () => ClassResponseDto })
  baseClass?: ClassResponseDto;

  @ApiPropertyOptional({ type: () => StaffResponseDto })
  teacher?: StaffResponseDto;

  @ApiPropertyOptional({ type: () => SemesterResponseDto })
  semester?: SemesterResponseDto;

  @ApiPropertyOptional({ type: () => ResponseSubjectDto })
  subject?: ResponseSubjectDto;
}

export class ResponseGetDetailCourseOffer extends ClassSubjectDto {}

export class ResponseCourseDataForExportExcel {}
