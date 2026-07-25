import { ApiProperty, ApiPropertyOptional, PickType } from "@nestjs/swagger";
import { StudentDto } from "./student.dto.js";
import { BatchDto } from "../../batch/batch.dto.js";
import { ClassDto } from "../../class/class.dto.js";
import { MajorDto } from "../../major/major.dto.js";

export class StudentDetailDto extends StudentDto {
  @ApiPropertyOptional({ type: BatchDto })
  batch?: BatchDto | null;

  @ApiPropertyOptional({ type: ClassDto })
  class?: ClassDto | null;

  @ApiPropertyOptional({ type: MajorDto })
  major?: MajorDto | null;
}

export class ResponseStudentPaginationDto {
  @ApiProperty({ type: [StudentDetailDto] })
  data: StudentDetailDto[];

  @ApiProperty()
  total: number;
}

// RESPONSE CHO API LẤY DANH SÁCH HỌC SINH TRNG ĐƯỢT THI VỚI BẢNG ĐIỂM VÀ CHUYÊN CẦN
export class StudentExamDetailForExamScheduleDto extends PickType(StudentDetailDto, [
  "id",
  "studentCode",
  "fullName",
  "phone",
  "gender",
  "dob",
]) {
  @ApiPropertyOptional({ type: Number, nullable: true })
  diemTB: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  totalPeriods: number;

  @ApiPropertyOptional({ type: Number, nullable: true })
  absentPeriods: number;

  @ApiPropertyOptional({ type: Number, nullable: true })
  absentPercentage: number;

  @ApiPropertyOptional({ type: String, nullable: true })
  examStatus: string;

  @ApiPropertyOptional({ type: Boolean, nullable: true })
  isManuallyLocked: boolean;

  @ApiPropertyOptional({ type: String, nullable: true })
  lockReason: string | null;
}
