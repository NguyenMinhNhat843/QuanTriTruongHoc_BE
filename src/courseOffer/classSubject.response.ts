import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsDate,
} from "class-validator";
import { CourseOffer } from "../../prisma/generated/prisma/client";
import { ClassResponseDto } from "../class/class.response";
import { StaffResponseDto } from "../staff/staff.response";
import { SemesterResponseDto } from "../semester/semester.response";
import { SubjectResponseDto } from "../subject/subject.response";

export class CourseOfferDto implements CourseOffer {
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

export class ClassSubjectResponseDto extends CourseOfferDto {
  @ApiPropertyOptional({ type: () => ClassResponseDto })
  baseClass?: ClassResponseDto;

  @ApiPropertyOptional({ type: () => StaffResponseDto })
  teacher?: StaffResponseDto;

  @ApiPropertyOptional({ type: () => SemesterResponseDto })
  semester?: SemesterResponseDto;

  @ApiPropertyOptional({ type: () => SubjectResponseDto })
  subject?: SubjectResponseDto;
}

export class ResponseGetDetailCourseOffer extends CourseOfferDto {}

/**
 * Response api previewGenerateSectionForClass
 * Xem trước danh sách các classSubject
 */
export class ResponsePreviewGenerateSectionForClass {
  @ApiProperty()
  @IsNumber()
  subjectId: number;

  @ApiProperty()
  @IsString()
  subjectCode: string;

  @ApiProperty()
  @IsString()
  subjectName: string;

  @ApiProperty()
  @IsNumber()
  credits: number;

  @ApiProperty()
  @IsBoolean()
  isExisted: boolean;
}

export class ResponseCourseDataForExportExcel {}
