import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { BatchResponseDto } from "../batch/batch.response.js";
import { ClassResponseDto } from "../class/class.response.js";
import { CreateStudentDto } from "./student.dto.js";

class DocumentProgressDto {
  @ApiProperty({
    example: 3,
    description: "Số lượng hồ sơ học sinh hiện đã nộp",
  })
  current: number;

  @ApiProperty({
    example: 5,
    description: "Tổng số lượng hồ sơ cần có theo cấu hình",
  })
  total: number;
}

export class StudentResponseDto extends CreateStudentDto {
  @ApiPropertyOptional({ type: BatchResponseDto, nullable: true })
  batch?: BatchResponseDto | null;

  @ApiPropertyOptional({ type: ClassResponseDto, nullable: true })
  class?: ClassResponseDto | null;

  @ApiProperty({
    type: DocumentProgressDto,
    description: "Thông tin tiến độ nộp hồ sơ của học sinh",
  })
  documentProgress: DocumentProgressDto;
}
