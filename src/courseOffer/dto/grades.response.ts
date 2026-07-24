import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { GradeStudent } from "../../../prisma/generated/prisma/client";
import { StudentDto } from "../../student/dtos/student.dto";
import { ClassSubjectDto } from "./classSubject.dto";
import { IsArray, IsInt, ValidateNested } from "class-validator";

// Giả sử bạn có Enum cho trạng thái đăng ký, nếu không có bạn có thể bỏ IsEnum và dùng IsString
export enum RegistrationStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export class GradeStudentDto implements GradeStudent {
  @ApiProperty({ type: Number })
  @Type(() => Number)
  id: number;

  @ApiProperty({ type: Number })
  @Type(() => Number)
  studentId: number;

  @ApiProperty({ type: Number })
  @Type(() => Number)
  classSubjectId: number;

  @ApiProperty({ type: Number, nullable: true })
  @Type(() => Number)
  kttx1: number | null;

  @ApiProperty({ type: Number, nullable: true })
  @Type(() => Number)
  kttx2: number | null;

  @ApiProperty({ type: Number, nullable: true })
  @Type(() => Number)
  kttx3: number | null;

  @ApiProperty({ type: Number, nullable: true })
  @Type(() => Number)
  ktdk1: number | null;

  @ApiProperty({ type: Number, nullable: true })
  @Type(() => Number)
  ktdk2: number | null;

  @ApiProperty({ type: Number, nullable: true })
  @Type(() => Number)
  ktdk3: number | null;

  @ApiProperty({ type: Number, nullable: true })
  @Type(() => Number)
  ktdk4: number | null;

  @ApiProperty({ type: Number, nullable: true })
  @Type(() => Number)
  diemKiemTra1: number | null;

  @ApiProperty({ type: Number, nullable: true })
  @Type(() => Number)
  diemKiemTra2: number | null;

  @ApiProperty({ type: Number, nullable: true })
  @Type(() => Number)
  diemBaoCao: number | null;

  @ApiProperty({ type: Number, nullable: true })
  @Type(() => Number)
  diemChuyenMon: number | null;

  @ApiProperty({ type: Number, nullable: true })
  @Type(() => Number)
  diemYThuc: number | null;

  @ApiProperty({ type: Number, nullable: true })
  @Type(() => Number)
  diemTongKet1: number | null;

  @ApiProperty({ type: Number, nullable: true })
  @Type(() => Number)
  diemTongKet2: number | null;

  @ApiProperty({ type: Number, nullable: true })
  @Type(() => Number)
  diemTB: number | null;

  @ApiProperty({ type: Number, nullable: true })
  rating: string | null;

  @ApiProperty({ type: String, nullable: true })
  note: string | null;

  @ApiProperty({ type: Date })
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty({ type: Date })
  @Type(() => Date)
  updatedAt: Date;
}

export class GradeStudentDeailDto extends GradeStudentDto {
  @ApiPropertyOptional({ type: () => StudentDto })
  student?: StudentDto;

  @ApiPropertyOptional({ type: () => ClassSubjectDto })
  classSubject?: ClassSubjectDto;
}

// CREATE GRADE DTO
export class CreateGradeDto extends OmitType(GradeStudentDto, ["id", "createdAt", "updatedAt"] as const) {}

// UPDATE GRADE DTO
export class UpdateGradeDto extends PartialType(GradeStudentDto) {}

// SAVE GRADE TABLE DTO
export class SaveGradesDto {
  @ApiProperty()
  @IsInt()
  classSubjectId: number;

  @ApiPropertyOptional({
    type: [UpdateGradeDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateGradeDto)
  grades?: UpdateGradeDto[];
}

export class SubjectGradeResponseDto {
  @ApiProperty()
  gradeId!: number;

  @ApiProperty()
  subjectId!: number;

  @ApiProperty()
  subjectCode!: string;

  @ApiProperty()
  subjectName!: string;

  @ApiProperty()
  credits!: number;

  @ApiProperty({ nullable: true })
  kttx1!: number | null;

  @ApiProperty({ nullable: true })
  kttx2!: number | null;

  @ApiProperty({ nullable: true })
  kttx3!: number | null;

  @ApiProperty({ nullable: true })
  ktdk1!: number | null;

  @ApiProperty({ nullable: true })
  ktdk2!: number | null;

  @ApiProperty({ nullable: true })
  ktdk3!: number | null;

  @ApiProperty({ nullable: true })
  ktdk4!: number | null;

  @ApiProperty({ nullable: true })
  diemTB!: number | null;

  @ApiProperty({ nullable: true })
  diemTongKet1!: number | null;

  @ApiProperty({ nullable: true })
  diemTongKet2!: number | null;

  @ApiProperty({ nullable: true })
  finalScore!: number | null;

  @ApiProperty()
  gradeFour!: number;

  @ApiProperty()
  gradeLetter!: string;

  @ApiProperty()
  isPassed!: boolean;
}

export class SemesterTranscriptResponseDto {
  @ApiProperty()
  semesterId!: number;

  @ApiProperty()
  semesterName!: string;

  @ApiProperty()
  term!: number;

  @ApiProperty()
  year!: number;

  @ApiProperty({ nullable: true })
  schoolYear!: string | null;

  @ApiProperty({ type: [SubjectGradeResponseDto] })
  subjects!: SubjectGradeResponseDto[];

  @ApiProperty()
  semesterGPA10!: number;

  @ApiProperty()
  semesterGPA4!: number;

  @ApiProperty()
  semesterCredits!: number;

  @ApiProperty()
  cumulativeCPA10!: number;

  @ApiProperty()
  cumulativeCPA4!: number;

  @ApiProperty()
  cumulativeCredits!: number;
}

export class StudentInfoResponseDto {
  @ApiProperty()
  studentId!: number;

  @ApiProperty()
  studentCode!: string;

  @ApiProperty()
  fullName!: string;
}

export class StudentTranscriptResponseDto {
  @ApiProperty({ type: StudentInfoResponseDto })
  studentInfo!: StudentInfoResponseDto;

  @ApiProperty({ type: [SemesterTranscriptResponseDto] })
  transcript!: SemesterTranscriptResponseDto[];
}
