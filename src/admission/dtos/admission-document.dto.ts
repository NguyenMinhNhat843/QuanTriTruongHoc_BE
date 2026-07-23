import { ApiProperty, ApiPropertyOptional, OmitType } from "@nestjs/swagger";
import { AdmissionDocument, DocumentStatus } from "../../../prisma/generated/prisma/client.js";

export class AdmissionDocumentDto implements AdmissionDocument {
  @ApiProperty()
  id: number;

  @ApiProperty()
  admissionProfileId: number;

  @ApiProperty()
  documentConfigItemId: number;

  @ApiProperty()
  fileUrl: string;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  fileSize: number;

  @ApiProperty({ enum: DocumentStatus })
  status: DocumentStatus;

  @ApiPropertyOptional({ type: String, nullable: true })
  rejectionReason: string | null;

  @ApiPropertyOptional({ type: Date, nullable: true })
  verifiedAt: Date | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  verifiedByUserId: number | null;

  @ApiProperty()
  isLatest: boolean;

  @ApiProperty()
  uploadedAt: Date;
}

export class CreateAdmissionDocumentDto extends OmitType(AdmissionDocumentDto, [
  "id",
  "status",
  "rejectionReason",
  "verifiedAt",
  "verifiedByUserId",
  "isLatest",
  "uploadedAt",
]) {}

export class VerifyAdmissionDocumentDto {
  @ApiProperty({ enum: DocumentStatus })
  status: DocumentStatus;

  @ApiPropertyOptional()
  rejectionReason?: string;
}
