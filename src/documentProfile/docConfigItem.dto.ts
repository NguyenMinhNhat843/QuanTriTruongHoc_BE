import { ApiProperty, OmitType, PartialType } from "@nestjs/swagger";
import { DocumentConfigItem } from "../../prisma/generated/prisma/client";
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { DocumentConfigResponseDto } from "./docConfig.dto";

export class DocumentConfigItemDto implements DocumentConfigItem {
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  id: number;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  documentConfigId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ type: Boolean, nullable: true })
  @IsBoolean()
  @IsOptional()
  required: boolean | null;

  @ApiProperty({ type: Number, nullable: true })
  @IsInt()
  @IsOptional()
  sortOrder: number | null;
}

export class DocumentConfigItemResponseDto extends DocumentConfigItemDto {
  @ApiProperty({ type: DocumentConfigResponseDto })
  documentConfig: DocumentConfigResponseDto;
}
export class CreateDocumentConfigItemDto extends OmitType(
  DocumentConfigItemDto,
  ["id"],
) {}
export class UpdateDocumentConfigItemDto extends PartialType(
  CreateDocumentConfigItemDto,
) {}
