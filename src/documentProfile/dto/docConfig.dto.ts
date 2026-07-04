import { ApiProperty, OmitType, PartialType } from "@nestjs/swagger";
import { DocumentConfig } from "../../../prisma/generated/prisma/client";
import {
  IsArray,
  IsDate,
  IsInt,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from "class-validator";
import { DocumentConfigItemDto } from "./docConfigItem.dto";
import { Type } from "class-transformer";

export class DocumentConfigDto implements DocumentConfig {
  @ApiProperty({ type: Number })
  @IsInt()
  id: number;

  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  startDate: Date;
}

export class DocumentConfigResponseDto extends DocumentConfigDto {}

export class DocumentConfigWithItemsResponseDto extends DocumentConfigDto {
  @ApiProperty({ type: () => [DocumentConfigItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  items: DocumentConfigItemDto[];
}

// DTO cho Create api
export class CreateDocumentItemPayloadDto extends OmitType(
  DocumentConfigItemDto,
  ["documentConfigId", "id"],
) {}
export class CreateDocumentConfigDto extends OmitType(DocumentConfigDto, [
  "id",
]) {
  @ApiProperty({ type: () => [CreateDocumentItemPayloadDto] })
  items: CreateDocumentItemPayloadDto[];
}

// DTO cho Update api
export class UpdateDocumentConfigDto extends PartialType(
  CreateDocumentConfigDto,
) {}
