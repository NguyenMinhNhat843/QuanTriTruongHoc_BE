import { ApiProperty, OmitType, PartialType, PickType } from "@nestjs/swagger";
import { DocumentConfig, EducationLevel, TrainingType } from "../../../prisma/generated/prisma/client";
import { DocumentConfigItemDto } from "./document-config-item.dto";

export class DocumentConfigDto implements DocumentConfig {
  @ApiProperty()
  id: number;

  @ApiProperty({ example: "Hồ sơ nhập học Hệ 9+" })
  name: string;

  @ApiProperty({ type: Date })
  startDate: Date;

  @ApiProperty({ type: Number, nullable: true })
  admissionCampaignId: number | null;

  @ApiProperty({ enum: EducationLevel, nullable: true })
  educationLevel: EducationLevel | null;

  @ApiProperty({ enum: TrainingType, nullable: true })
  trainingType: TrainingType | null;
}

// CREATE DTO
export class DocumentConfigItemsPayloadDto extends OmitType(DocumentConfigItemDto, ["id", "documentConfigId"]) {}
export class CreateDocumentConfigDto extends OmitType(DocumentConfigDto, ["id"]) {
  @ApiProperty({ type: [DocumentConfigItemsPayloadDto] })
  items: DocumentConfigItemsPayloadDto[];
}

// UPDATE DTO
export class UpdateDocumentConfigDto extends PartialType(CreateDocumentConfigDto) {}

// SEARCH DTO
export class SearchDocumentConfigDto extends PartialType(
  PickType(DocumentConfigDto, ["name", "admissionCampaignId", "educationLevel", "trainingType"]),
) {}

// RESPONSE PAGINATION DTO
export class ResponseDocumentConfigPaginationDto {
  @ApiProperty({ type: [DocumentConfigDto] })
  data: DocumentConfigDto[];

  @ApiProperty({ type: Number })
  total: number;
}
