import { ApiProperty, OmitType, PartialType, PickType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { StudentExamDetail } from "../../../prisma/generated/prisma/client";
import { StudentDto } from "../../student/dtos/student.dto";

export class StudentExamDetailDto implements StudentExamDetail {
  @ApiProperty()
  @Type(() => Number)
  id: number;

  @ApiProperty()
  @Type(() => Number)
  studentId: number;

  @ApiProperty()
  @Type(() => Number)
  examScheduleId: number;

  @ApiProperty({ type: String, nullable: true })
  deskNumber: string | null;

  @ApiProperty({ type: String, nullable: true })
  identificationNum: string | null;

  @ApiProperty()
  @Type(() => Boolean)
  isAttended: boolean;

  @ApiProperty()
  @Type(() => Boolean)
  isViolated: boolean;

  @ApiProperty({ type: String, nullable: true })
  violationNote: string | null;

  @ApiProperty()
  @Type(() => Date)
  createdAt: Date;
}

export class StudentExamDetailDetailDto extends StudentExamDetailDto {
  @ApiProperty({ type: StudentDto, nullable: true })
  student?: StudentDto;
}

// CREATE DTO
export class CreateStudentExamDetailDto extends OmitType(StudentExamDetailDto, ["id", "createdAt"] as const) {}

// UPDATE DTO
export class UpdateStudentExamDetailDto extends PartialType(StudentExamDetailDto) {}

// SEARCH DTO
export class SearchStudentExamDetailDto extends PartialType(
  PickType(StudentExamDetailDto, ["studentId", "examScheduleId"] as const),
) {}
