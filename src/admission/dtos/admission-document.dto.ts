import { ApiProperty, ApiPropertyOptional, OmitType } from "@nestjs/swagger";
import { AdmissionDocument, DocumentStatus } from "../../../prisma/generated/prisma/client.js";
import { Type } from "class-transformer";

export class AdmissionDocumentDto implements AdmissionDocument {
  @ApiProperty()
  id: number;

  @ApiProperty()
  @Type(() => Number)
  admissionProfileId: number;

  @ApiProperty()
  @Type(() => Number)
  documentConfigItemId: number;

  @ApiProperty()
  fileUrl: string;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  @Type(() => Number)
  fileSize: number;

  @ApiProperty({ enum: DocumentStatus })
  status: DocumentStatus;

  @ApiPropertyOptional({ type: String, nullable: true })
  rejectionReason: string | null;

  @ApiPropertyOptional({ type: Date, nullable: true })
  @Type(() => Date)
  verifiedAt: Date | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @Type(() => Number)
  verifiedByUserId: number | null;

  @ApiProperty()
  @Type(() => Boolean)
  isLatest: boolean;

  @ApiProperty()
  uploadedAt: Date;
}

export class CreateAdmissionDocumentDto extends OmitType(AdmissionDocumentDto, [
  "id",
  "fileUrl", // Sẽ tự động lấy từ kết quả upload
  "fileName", // Sẽ tự động lấy từ file.originalname
  "fileSize", // Sẽ tự động lấy từ file.size
  "status",
  "rejectionReason",
  "verifiedAt",
  "verifiedByUserId",
  "isLatest",
  "uploadedAt",
]) {
  @ApiProperty({ type: "string", format: "binary", description: "File tài liệu/hình ảnh" })
  file: any;
}

export class VerifyAdmissionDocumentDto {
  @ApiProperty({ enum: DocumentStatus })
  status: DocumentStatus;

  @ApiPropertyOptional()
  rejectionReason?: string;
}
