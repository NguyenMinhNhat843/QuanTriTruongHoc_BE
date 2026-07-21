import { ApiProperty, OmitType, PartialType, PickType } from "@nestjs/swagger";
import { AdmissionStatusLog, ApplicationStatus } from "../../../prisma/generated/prisma/client";

export class AdmissionStatusLogDto implements AdmissionStatusLog {
  @ApiProperty()
  id: number;

  @ApiProperty()
  admissionProfileId: number;

  @ApiProperty({ enum: ApplicationStatus, nullable: true })
  fromStatus: ApplicationStatus | null;

  @ApiProperty({ enum: ApplicationStatus })
  toStatus: ApplicationStatus;

  @ApiProperty()
  byUserId: number;

  @ApiProperty({ type: String, nullable: true })
  reason: string | null;

  @ApiProperty({ type: Date })
  createdAt: Date;
}

// CREATE DTO
export class CreateAdmissionStatusLogDto extends OmitType(AdmissionStatusLogDto, ["id", "createdAt"]) {}

// UPDATE DTO (Hiếm khi dùng vì audit log thường chỉ ghi không sửa, nhưng vẫn giữ đúng pattern)
export class UpdateAdmissionStatusLogDto extends PartialType(CreateAdmissionStatusLogDto) {}

// SEARCH DTO
export class SearchAdmissionStatusLogDto extends PartialType(
  PickType(AdmissionStatusLogDto, ["admissionProfileId", "toStatus", "byUserId"]),
) {}

// RESPONSE TYPE (PAGINATION)
export class ResponseAdmissionStatusLogPaginationDto {
  @ApiProperty({ type: [AdmissionStatusLogDto] })
  data: AdmissionStatusLogDto[];

  @ApiProperty({ type: Number })
  total: number;
}
