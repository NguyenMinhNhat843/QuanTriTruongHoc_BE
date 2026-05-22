import { ApiPropertyOptional } from "@nestjs/swagger";
import { BatchResponseDto } from "../batch/batch.response.js";
import { ClassResponseDto } from "../class/class.response.js";
import { CreateStudentDto } from "./student.dto.js";

export class StudentResponseDto extends CreateStudentDto {
  @ApiPropertyOptional({ type: BatchResponseDto, nullable: true })
  batch?: BatchResponseDto | null;

  @ApiPropertyOptional({ type: ClassResponseDto, nullable: true })
  class?: ClassResponseDto | null;
}
