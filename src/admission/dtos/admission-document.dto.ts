import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { DocumentStatus } from "../../../prisma/generated/prisma/client.js";

export class AdmissionDocumentDto {
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

  @ApiPropertyOptional()
  rejectionReason?: string;

  @ApiPropertyOptional()
  verifiedAt?: Date;

  @ApiPropertyOptional()
  verifiedByUserId?: number;

  @ApiProperty()
  isLatest: boolean;

  @ApiProperty()
  uploadedAt: Date;
}

export class CreateAdmissionDocumentDto {
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
}

export class VerifyAdmissionDocumentDto {
  @ApiProperty({ enum: DocumentStatus })
  status: DocumentStatus;

  @ApiPropertyOptional()
  rejectionReason?: string;
}

