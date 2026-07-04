import { ApiProperty } from "@nestjs/swagger";
import { BatchDto } from "./batch.dto";
import { MajorDto } from "../major/major.dto";

export class BatchResponseDto extends BatchDto {
  @ApiProperty({ type: MajorDto, nullable: true })
  major?: MajorDto | null;
}
