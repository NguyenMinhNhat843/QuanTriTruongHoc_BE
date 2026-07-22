import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TrainingType } from "../../../prisma/generated/prisma/client.js";

export class AdmissionInterestDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  phone: string;

  @ApiPropertyOptional()
  identityNumber?: string;

  @ApiProperty()
  majorId: number;

  @ApiProperty({ enum: TrainingType })
  trainingType: TrainingType;

  @ApiPropertyOptional()
  note?: string;

  @ApiPropertyOptional()
  notifiedAt?: Date;

  @ApiProperty()
  createdAt: Date;
}

export class CreateAdmissionInterestDto {
  @ApiProperty()
  fullName: string;

  @ApiProperty()
  phone: string;

  @ApiPropertyOptional()
  identityNumber?: string;

  @ApiProperty()
  majorId: number;

  @ApiProperty({ enum: TrainingType })
  trainingType: TrainingType;

  @ApiPropertyOptional()
  note?: string;
}

export class SearchAdmissionInterestDto {
  @ApiPropertyOptional()
  fullName?: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  majorId?: number;

  @ApiPropertyOptional({ enum: TrainingType })
  trainingType?: TrainingType;

  @ApiPropertyOptional({ type: Boolean })
  isNotified?: boolean;

  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  limit?: number;
}

