import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
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
