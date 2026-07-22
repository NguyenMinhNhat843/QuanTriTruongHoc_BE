import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { EducationLevel, TrainingType } from "../../../prisma/generated/prisma/client.js";

export class DocumentConfigItemDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  documentConfigId: number;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  code?: string;

  @ApiPropertyOptional()
  required?: boolean;

  @ApiPropertyOptional()
  sortOrder?: number;
}

export class CreateDocumentConfigItemDto {
  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  code?: string;

  @ApiPropertyOptional({ default: true })
  required?: boolean;

  @ApiPropertyOptional()
  sortOrder?: number;
}

export class DocumentConfigDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  startDate: Date;

  @ApiPropertyOptional()
  admissionCampaignId?: number;

  @ApiPropertyOptional({ enum: EducationLevel })
  educationLevel?: EducationLevel;

  @ApiPropertyOptional({ enum: TrainingType })
  trainingType?: TrainingType;

  @ApiPropertyOptional({ type: [DocumentConfigItemDto] })
  items?: DocumentConfigItemDto[];
}

export class CreateDocumentConfigDto {
  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  startDate?: Date;

  @ApiPropertyOptional()
  admissionCampaignId?: number;

  @ApiPropertyOptional({ enum: EducationLevel })
  educationLevel?: EducationLevel;

  @ApiPropertyOptional({ enum: TrainingType })
  trainingType?: TrainingType;

  @ApiPropertyOptional({ type: [CreateDocumentConfigItemDto] })
  items?: CreateDocumentConfigItemDto[];
}

export class UpdateDocumentConfigDto {
  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional()
  startDate?: Date;

  @ApiPropertyOptional()
  admissionCampaignId?: number;

  @ApiPropertyOptional({ enum: EducationLevel })
  educationLevel?: EducationLevel;

  @ApiPropertyOptional({ enum: TrainingType })
  trainingType?: TrainingType;

  @ApiPropertyOptional({ type: [CreateDocumentConfigItemDto] })
  items?: CreateDocumentConfigItemDto[];
}

export class SearchDocumentConfigDto {
  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional()
  admissionCampaignId?: number;

  @ApiPropertyOptional({ enum: EducationLevel })
  educationLevel?: EducationLevel;

  @ApiPropertyOptional({ enum: TrainingType })
  trainingType?: TrainingType;

  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  limit?: number;
}

