import { ApiProperty, ApiPropertyOptional, OmitType, PartialType, PickType } from "@nestjs/swagger";
import { EducationLevel, StudentStatus, Gender } from "../../../prisma/generated/prisma/client.js";
import { Type } from "class-transformer";

export class StudentDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  studentCode: string;

  @ApiProperty()
  identityNumber: string;

  @ApiProperty()
  userId: number;

  @ApiPropertyOptional()
  batchId?: number;

  @ApiPropertyOptional()
  majorId?: number;

  @ApiPropertyOptional()
  classId?: number;

  @ApiProperty({ enum: EducationLevel, default: EducationLevel.THCS })
  educationLevel: EducationLevel;

  @ApiProperty({ enum: StudentStatus, default: StudentStatus.STUDYING })
  status: StudentStatus;

  @ApiPropertyOptional()
  enrollmentDate?: Date;

  @ApiPropertyOptional()
  graduationDate?: Date;

  @ApiProperty()
  fullName: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional({ enum: Gender })
  gender?: Gender;

  @ApiPropertyOptional()
  dob?: Date;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  avatarUrl?: string;

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
