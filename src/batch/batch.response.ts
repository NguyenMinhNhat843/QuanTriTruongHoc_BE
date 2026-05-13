import { ApiProperty } from "@nestjs/swagger";
import { MajorResponseDto } from "../major/major.response";

export class BatchResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  batchCode: string;

  @ApiProperty()
  batchName: string;

  @ApiProperty()
  startYear: number;

  @ApiProperty()
  endYear: number;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty()
  status: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: MajorResponseDto, nullable: true })
  major?: MajorResponseDto | null;

  constructor(data: any) {
    this.id = data.id;
    this.batchCode = data.batchCode;
    this.batchName = data.batchName;
    this.startYear = data.startYear;
    this.endYear = data.endYear;
    this.description = data.description;
    this.status = data.status;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;

    this.major = data.major ? new MajorResponseDto(data.major) : null;
  }
}
