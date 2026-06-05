import { ApiProperty, OmitType, PartialType } from "@nestjs/swagger";
import { DocumentConfig } from "../../prisma/generated/prisma/client";
import {
  IsArray,
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
}

export class DocumentConfigResponseDto extends DocumentConfigDto {}
export class DocumentConfigWithItemsResponseDto extends DocumentConfigDto {
  @ApiProperty({ type: () => [DocumentConfigItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentConfigItemDto)
  items: DocumentConfigItemDto[];
}

export class CreateDocumentConfigDto extends OmitType(DocumentConfigDto, [
  "id",
]) {}
export class UpdateDocumentConfigDto extends PartialType(
  CreateDocumentConfigDto,
) {}
