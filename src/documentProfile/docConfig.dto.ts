import { ApiProperty, OmitType, PartialType } from "@nestjs/swagger";
import { DocumentConfig } from "../../prisma/generated/prisma/client";
import { IsInt, IsNotEmpty, IsString } from "class-validator";

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

export class CreateDocumentConfigDto extends OmitType(DocumentConfigDto, [
  "id",
]) {}
export class UpdateDocumentConfigDto extends PartialType(
  CreateDocumentConfigDto,
) {}
