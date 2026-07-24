import { ApiProperty, ApiPropertyOptional, OmitType, PartialType, PickType } from "@nestjs/swagger";
import { EducationLevel, StudentStatus, Gender, Student } from "../../../prisma/generated/prisma/client.js";
import { Type } from "class-transformer";

export class StudentDto implements Student {
  @ApiProperty()
  id: number;

  @ApiProperty()
  studentCode: string;

  @ApiProperty()
  identityNumber: string;

  @ApiProperty()
  userId: number;

  @ApiProperty({ enum: EducationLevel, default: EducationLevel.THCS })
  educationLevel: EducationLevel;

  @ApiProperty({ enum: StudentStatus, default: StudentStatus.STUDYING })
  status: StudentStatus;

  @ApiProperty()
  fullName: string;

  @ApiProperty({ type: String, nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ type: Number, nullable: true })
  batchId: number | null;

  @ApiProperty({ type: Number, nullable: true })
  classId: number | null;

  @ApiProperty({ type: Date, nullable: true })
  dob: Date | null;

  @ApiProperty({ type: String, nullable: true })
  email: string | null;

  @ApiProperty({ type: Date, nullable: true })
  enrollmentDate: Date | null;

  @ApiProperty({ enum: Gender, nullable: true })
  gender: Gender | null;

  @ApiProperty({ type: Date, nullable: true })
  graduationDate: Date | null;

  @ApiProperty({ type: Number, nullable: true })
  majorId: number | null;

  @ApiProperty({ type: String, nullable: true })
  phone: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CreateStudentDto extends OmitType(StudentDto, ["id", "createdAt", "updatedAt"]) {}

export class UpdateStudentDto extends PartialType(CreateStudentDto) {}

export class SearchStudentDto extends PartialType(
  PickType(StudentDto, [
    "studentCode",
    "identityNumber",
    "fullName",
    "phone",
    "email",
    "status",
    "batchId",
    "majorId",
    "classId",
  ]),
) {
  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  limit?: number;
}

export class FindOneStudentDto {
  @ApiPropertyOptional()
  @Type(() => Number)
  id?: number;

  @ApiPropertyOptional()
  identityNumber?: string;

  @ApiPropertyOptional()
  studentCode?: string;
}

export class GetEligibleStudentsDto {
  @ApiProperty()
  @Type(() => Number)
  batchId: number;
}

export class AssignStudentsToClassesDto {
  @ApiPropertyOptional()
  batchId?: number;

  @ApiPropertyOptional({ default: 40 })
  studentsPerClass?: number;
}

export class ResponseStudentPaginationDto {
  @ApiProperty({ type: [StudentDto] })
  data: StudentDto[];

  @ApiProperty()
  total: number;
}
