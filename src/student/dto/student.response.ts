import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { BatchResponseDto } from "../../batch/batch.response.js";
import { ClassResponseDto } from "../../class/class.response.js";
import { CreateStudentDto } from "./student.dto.js";
import { MajorSimpleDto } from "../../major/major.dto.js";

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

  @ApiPropertyOptional({ type: MajorSimpleDto, nullable: true })
  major?: MajorSimpleDto;

  @ApiProperty({
    type: DocumentProgressDto,
    description: "Thông tin tiến độ nộp hồ sơ của học sinh",
  })
  documentProgress: DocumentProgressDto;
}

export class QualifiedStudentResponseDto extends StudentResponseDto {
  @ApiProperty({
    type: Boolean,
    description: "Học sinh có đủ điều kiện xét tuyển ko",
  })
  isQualified: boolean;
}
export class ResponseStudentPaginationDto {
  @ApiProperty({ type: [QualifiedStudentResponseDto] })
  students: QualifiedStudentResponseDto[];

  @ApiProperty()
  total: number;
}
