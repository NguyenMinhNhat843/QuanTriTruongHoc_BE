import { ApiProperty } from "@nestjs/swagger";
import { MajorResponseDto } from "../major/major.response";
import { BatchDto } from "./batch.dto";

export class BatchResponseDto extends BatchDto {
  @ApiProperty({ type: MajorResponseDto, nullable: true })
  major?: MajorResponseDto | null;
}
