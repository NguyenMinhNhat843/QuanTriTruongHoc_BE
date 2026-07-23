import { ApiProperty, ApiPropertyOptional, OmitType, PartialType, PickType } from "@nestjs/swagger";
import { DocumentConfig, DocumentConfigItem } from "../../../prisma/generated/prisma/client.js";
import { Type } from "class-transformer";

export class DocumentConfigItemDto implements DocumentConfigItem {
  @ApiProperty()
  id: number;

  @ApiProperty()
  documentConfigId: number;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  code: string | null;

  @ApiPropertyOptional({ type: Boolean, nullable: true })
  required: boolean | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  sortOrder: number | null;
}

export class CreateDocumentConfigItemDto extends OmitType(DocumentConfigItemDto, ["id", "documentConfigId"] as const) {}

export class DocumentConfigDto implements DocumentConfig {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  startDate: Date;
}

export class DocumentConfigDetailDto extends DocumentConfigDto {
  @ApiPropertyOptional({ type: [DocumentConfigItemDto] })
  items?: DocumentConfigItemDto[];
}

export class CreateDocumentConfigDto extends OmitType(DocumentConfigDto, ["id"] as const) {
  @ApiPropertyOptional({ type: [CreateDocumentConfigItemDto] })
  items?: CreateDocumentConfigItemDto[];
}

export class UpdateDocumentConfigDto extends PartialType(CreateDocumentConfigDto) {}

export class SearchDocumentConfigDto extends PartialType(
  PickType(DocumentConfigDto, ["id", "name", "startDate"] as const),
) {}

export class FindLatestDocumentConfigQueryDto {
  @ApiProperty({ type: Date })
  @Type(() => Date)
  targetDateInput: Date | string;
}
