import { ApiProperty, ApiPropertyOptional, PickType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, IsOptional } from "class-validator";
import { StudentResponseDto } from "./student.response";
import { BatchDto } from "../../batch/batch.dto";

/**
 * Lấy danh sách sinh viên đủ điều kiện để phân lớp
 */
export class GetEligibleStudentsDtoForAssignment {
  @ApiProperty({
    type: Number,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "batchId phải là số!" })
  batchId?: number;
}

class StudentSimpleInfo extends PickType(StudentResponseDto, [
  "id",
  "studentCode",
  "fullName",
] as const) {}
class BatchSimpleDto extends PickType(BatchDto, [
  "id",
  "batchCode",
  "batchName",
] as const) {}
export class GetEligibleStudentsDtoForAssignmentResponse {
  @ApiProperty({ type: StudentSimpleInfo })
  student: StudentSimpleInfo;

  @ApiProperty({ type: BatchSimpleDto })
  batch: BatchSimpleDto;
}

export class AssignStudentsToClassesDto {
  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  batchId?: number;

  @ApiPropertyOptional({ type: Number, default: 40 })
  @IsOptional()
  @IsNumber()
  studentsPerClass?: number;
}
