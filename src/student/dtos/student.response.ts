import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { CreateStudentDto } from "./student.dto.js";

class DocumentProgressDto {
  @ApiProperty()
  current: number;

  @ApiProperty()
  total: number;
}

export class StudentResponseDto extends CreateStudentDto {
  @ApiPropertyOptional()
  batch?: any;

  @ApiPropertyOptional()
  class?: any;

  @ApiPropertyOptional()
  major?: any;

  @ApiPropertyOptional({ type: DocumentProgressDto })
  documentProgress?: DocumentProgressDto;
}

export class QualifiedStudentResponseDto extends StudentResponseDto {
  @ApiProperty()
  isQualified: boolean;
}

export class ResponseStudentPaginationDto {
  @ApiProperty({ type: [QualifiedStudentResponseDto] })
  students: QualifiedStudentResponseDto[];

  @ApiProperty()
  total: number;
}
