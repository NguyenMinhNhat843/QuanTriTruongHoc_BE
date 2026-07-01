import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { BatchResponseDto } from "../../batch/batch.response.js";
import { ClassResponseDto } from "../../class/class.response.js";
import { CreateStudentDto } from "./student.dto.js";

class DocumentProgressDto {
  @ApiProperty()
  current: number;

  @ApiProperty()
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
