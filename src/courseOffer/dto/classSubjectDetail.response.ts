import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import { StaffResponseDto } from "../../staff/staff.response";
import { SemesterResponseDto } from "../../semester/semester.response";
import { ClassResponseDto } from "../../class/class.response";
import { Type } from "class-transformer";
import { CourseOfferStatus } from "../../../prisma/generated/prisma/enums";
import { CourseOffer } from "../../../prisma/generated/prisma/client";
import { ResponseSubjectDto } from "../../subject/subject.dto";
import { GradeStudentDto } from "./grades.response";

export class CourseOfferDetailResponseDto implements CourseOffer {
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  id: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  courseCode: string;

  @ApiPropertyOptional({
    nullable: true,
    type: String,
  })
  @IsString()
  @IsOptional()
  courseName: string | null;

  @ApiPropertyOptional({
    nullable: true,
    type: Number,
  })
  @IsInt()
  @IsOptional()
  teacherId: number | null;

  @ApiPropertyOptional({
    nullable: true,
    type: Number,
  })
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

  @ApiProperty({
    example: 40,
  })
  @IsInt()
  @Min(0)
  maxStudents: number;

  @ApiProperty({
    example: 35,
  })
  @IsInt()
  @Min(0)
  currentStudents: number;

  @ApiProperty({
    enum: CourseOfferStatus,
  })
  @IsEnum(CourseOfferStatus)
  status: CourseOfferStatus;

  @ApiPropertyOptional({
    nullable: true,
    type: Date,
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  startDate: Date | null;

  @ApiPropertyOptional({
    nullable: true,
    type: Date,
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endDate: Date | null;

  @ApiPropertyOptional({
    nullable: true,
    type: Date,
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  registrationStart: Date | null;

  @ApiPropertyOptional({
    nullable: true,
    type: Date,
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  registrationEnd: Date | null;

  @ApiProperty({})
  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty({})
  @IsDate()
  @Type(() => Date)
  updatedAt: Date;

  // --- CÁC QUAN HỆ ĐI KÈM (RELATION FIELDS) ---

  @ApiPropertyOptional({
    type: () => ClassResponseDto,
    nullable: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ClassResponseDto)
  baseClass: ClassResponseDto | null;

  @ApiPropertyOptional({
    type: () => ResponseSubjectDto,
    nullable: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ResponseSubjectDto)
  subject: ResponseSubjectDto | null;

  @ApiPropertyOptional({
    type: () => SemesterResponseDto,
    nullable: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SemesterResponseDto)
  semester: SemesterResponseDto | null;

  @ApiPropertyOptional({
    type: () => StaffResponseDto,
    nullable: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => StaffResponseDto)
  teacher: StaffResponseDto | null;

  @ApiPropertyOptional({
    type: [GradeStudentDto],
    nullable: true,
  })
  @Type(() => GradeStudentDto)
  gradeStudents: GradeStudentDto[] | null;
}
