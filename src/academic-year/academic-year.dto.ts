import { ApiProperty, OmitType, PartialType, PickType } from "@nestjs/swagger";
import { AcademicYear, AcademicYearStatus } from "../../prisma/generated/prisma/client";

export class AcademicYearDto implements AcademicYear {
  @ApiProperty()
  id: number;

  @ApiProperty({ example: "2023-2024" })
  code: string;

  @ApiProperty({
    enum: AcademicYearStatus,
    enumName: "AcademicYearStatus",
    default: AcademicYearStatus.ACTIVE,
  })
  status: AcademicYearStatus;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty({ default: false })
  isCurrent: boolean;
}

// CREATE DTO
export class CreateAcademicYearDto extends OmitType(AcademicYearDto, ["id"] as const) {}

// UPDATE DTO
export class UpdateAcademicYearDto extends PartialType(CreateAcademicYearDto) {}

// SEARCH  DTO
export class SearchAcademicYearDto extends PartialType(
  PickType(AcademicYearDto, ["code", "status", "isCurrent"] as const),
) {
  @ApiProperty({ required: false, default: 1 })
  page?: number;

  @ApiProperty({ required: false, default: 10 })
  limit?: number;
}

// PAGINATION RESPONSE DTO
export class ResponseAcademicYearPaginationDto {
  @ApiProperty({ type: [AcademicYearDto] })
  data: AcademicYearDto[];

  @ApiProperty({ default: 0 })
  total: number;
}
