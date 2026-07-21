import { ApiProperty, OmitType, PartialType, PickType } from "@nestjs/swagger";
import { AdmissionDocument, DocumentStatus } from "../../../prisma/generated/prisma/client";

export class AdmissionDocumentDto implements AdmissionDocument {
  @ApiProperty()
  id: number;

  @ApiProperty()
  admissionProfileId: number;

  @ApiProperty()
  documentConfigItemId: number;

  @ApiProperty({ example: "https://storage.example.com/docs/hocba.pdf" })
  fileUrl: string;

  @ApiProperty({ example: "hocba_thcs.pdf" })
  fileName: string;

  @ApiProperty({ example: 1024000, description: "Kích thước file tính bằng byte" })
  fileSize: number;

  @ApiProperty({ enum: DocumentStatus, default: DocumentStatus.PENDING })
  status: DocumentStatus;

  @ApiProperty({ type: String, nullable: true })
  rejectionReason: string | null;

  @ApiProperty({ type: Date, nullable: true })
  verifiedAt: Date | null;

  @ApiProperty({ type: Number, nullable: true })
  verifiedByUserId: number | null;

  @ApiProperty({ type: Date })
  uploadedAt: Date;
}

// CREATE DTO: Bỏ id, status, các trường verify và thời gian tải lên (hệ thống/admin tự xử lý)
export class CreateAdmissionDocumentDto extends OmitType(AdmissionDocumentDto, [
  "id",
  "status",
  "rejectionReason",
  "verifiedAt",
  "verifiedByUserId",
  "uploadedAt",
]) {}

// UPDATE DTO
export class UpdateAdmissionDocumentDto extends PartialType(CreateAdmissionDocumentDto) {}

// SEARCH DTO
export class SearchAdmissionDocumentDto extends PartialType(
  PickType(AdmissionDocumentDto, ["admissionProfileId", "documentConfigItemId", "status"]),
) {}

// RESPONSE TYPE (PAGINATION)
export class ResponseAdmissionDocumentPaginationDto {
  @ApiProperty({ type: [AdmissionDocumentDto] })
  data: AdmissionDocumentDto[];

  @ApiProperty({ type: Number })
  total: number;
}
