import { ApiProperty, ApiPropertyOptional, OmitType, PartialType, PickType } from "@nestjs/swagger";
import { Student, EducationLevel, StudentStatus, Gender } from "../../../prisma/generated/prisma/client";
import { Type } from "class-transformer";

export class StudentDto implements Student {
  @ApiProperty()
  id: number;

  @ApiProperty({ example: "SV2026001" })
  studentCode: string;

  @ApiProperty({ example: "038200001234" })
  identityNumber: string;

  @ApiProperty()
  userId: number;

  @ApiProperty({ type: Number, nullable: true })
  batchId: number | null;

  @ApiProperty({ type: Number, nullable: true })
  majorId: number | null;

  @ApiProperty({ type: Number, nullable: true })
  classId: number | null;

  @ApiProperty({ enum: EducationLevel, default: EducationLevel.THCS })
  educationLevel: EducationLevel;

  @ApiProperty({ enum: StudentStatus, default: StudentStatus.STUDYING })
  status: StudentStatus;

  @ApiProperty({ type: Date, nullable: true })
  enrollmentDate: Date | null;

  @ApiProperty({ type: Date, nullable: true })
  graduationDate: Date | null;

  @ApiProperty({ example: "Nguyễn Văn A" })
  fullName: string;

  @ApiProperty({ type: String, nullable: true, example: "nguyenvana@gmail.com" })
  email: string | null;

  @ApiProperty({ enum: Gender, nullable: true })
  gender: Gender | null;

  @ApiProperty({ type: Date, nullable: true })
  dob: Date | null;

  @ApiProperty({ type: String, nullable: true, example: "0912345678" })
  phone: string | null;

  @ApiProperty({ type: String, nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}

// CREATE DTO: Bỏ các trường hệ thống tự sinh (id, createdAt, updatedAt)
export class CreateStudentDto extends OmitType(StudentDto, ["id", "createdAt", "updatedAt"]) {}

// UPDATE DTO: Cho phép cập nhật từng trường của CreateStudentDto
export class UpdateStudentDto extends PartialType(CreateStudentDto) {}

// SEARCH DTO: Lọc theo các trường định danh và thông tin phân luồng
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
  @ApiProperty({ type: Number, required: false })
  page?: number;

  @ApiProperty({ type: Number, required: false })
  limit?: number;
}

export class FindOneStudentDto {
  @ApiPropertyOptional({ type: Number })
  @Type(() => Number)
  id?: number;

  @ApiPropertyOptional({ type: String })
  identityNumber?: string;

  @ApiPropertyOptional({ type: String })
  studentCode?: string;
}

// LẤY DANH SÁCH STUDENT ĐỦ ĐIỀU KIỆN PHÂN LỚP
export class GetEligibleStudentsDto {
  @ApiProperty()
  @Type(() => Number)
  batchId: number;
}

// PHÂN LỚP CHO HỌC SINH
export class AssignStudentsToClassesDto {
  @ApiPropertyOptional({ type: Number })
  batchId?: number;

  @ApiPropertyOptional({ type: Number, default: 40 })
  studentsPerClass?: number;
}

// RESPONSE PAGINATION DTO
export class ResponseStudentPaginationDto {
  @ApiProperty({ type: [StudentDto] })
  data: StudentDto[];

  @ApiProperty({ type: Number })
  total: number;
}
