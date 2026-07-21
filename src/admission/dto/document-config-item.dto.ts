import { ApiProperty, OmitType, PartialType, PickType } from "@nestjs/swagger";
import { DocumentConfigItem } from "../../../prisma/generated/prisma/client";

export class DocumentConfigItemDto implements DocumentConfigItem {
  @ApiProperty()
  id: number;

  @ApiProperty()
  documentConfigId: number;

  @ApiProperty({ example: "Học bạ THCS" })
  name: string;

  @ApiProperty({ type: String, nullable: true, example: "TRANSCRIPT_THCS" })
  code: string | null;

  @ApiProperty({ type: Boolean, nullable: true, default: true })
  required: boolean | null;

  @ApiProperty({ type: Number, nullable: true, default: 0 })
  sortOrder: number | null;
}

// CREATE DTO
export class CreateDocumentConfigItemDto extends OmitType(DocumentConfigItemDto, ["id"]) {}

// UPDATE DTO
export class UpdateDocumentConfigItemDto extends PartialType(CreateDocumentConfigItemDto) {}

// SEARCH DTO
export class SearchDocumentConfigItemDto extends PartialType(
  PickType(DocumentConfigItemDto, ["documentConfigId", "name", "code", "required"]),
) {}

// RESPONSE PAGINATION DTO
export class ResponseDocumentConfigItemPaginationDto {
  @ApiProperty({ type: [DocumentConfigItemDto] })
  data: DocumentConfigItemDto[];

  @ApiProperty({ type: Number })
  total: number;
}
