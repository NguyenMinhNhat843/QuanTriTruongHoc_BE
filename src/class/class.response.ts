import { ApiPropertyOptional } from "@nestjs/swagger";
import { StaffResponseDto } from "../staff/dto/staff.response";
import { BatchResponseDto } from "../batch/batch.response";
import { MajorDto } from "../major/major.dto";
import { ClassDto } from "./class.dto";

export class ClassResponseDto extends ClassDto {}

export class ClassResponseWithRelationsDto extends ClassResponseDto {
  @ApiPropertyOptional({
    type: () => MajorDto,
  })
  major?: MajorDto;

  @ApiPropertyOptional({
    type: () => BatchResponseDto,
  })
  batch?: BatchResponseDto;

  @ApiPropertyOptional({
    type: () => StaffResponseDto,
  })
  formTeacher?: StaffResponseDto;
}
