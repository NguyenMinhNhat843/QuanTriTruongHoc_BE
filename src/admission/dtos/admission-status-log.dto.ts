import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { AdmissionStatusLog, ApplicationStatus } from "../../../prisma/generated/prisma/client";

export class AdmissionStatusLogDto implements AdmissionStatusLog {
  @ApiProperty()
  @Type(() => Number)
  id: number;

  @ApiProperty()
  @Type(() => Number)
  admissionProfileId: number;

  @ApiPropertyOptional({ enum: ApplicationStatus, nullable: true })
  fromStatus: ApplicationStatus | null;

  @ApiProperty()
  @Type(() => Boolean)
  isSystem: boolean;

  @ApiPropertyOptional({ type: String, nullable: true })
  reason: string | null;

  @ApiProperty({ enum: ApplicationStatus })
  toStatus: ApplicationStatus;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @Type(() => Number)
  byUserId: number | null;

  @ApiProperty({ type: Date })
  @Type(() => Date)
  createdAt: Date;
}
