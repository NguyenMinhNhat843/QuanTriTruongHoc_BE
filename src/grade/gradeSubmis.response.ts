import { ApiProperty } from "@nestjs/swagger";
import {
  GradeSubmission,
  GradeSubmissionStatus,
} from "../../prisma/generated/prisma/client";
import { Expose, Type } from "class-transformer";
import { GradeEntryResponseDto } from "./gradeEntry.response";
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  ValidateNested,
} from "class-validator";

export class SubmitGradeResponse {
  @ApiProperty({ type: String })
  message: string;

  @ApiProperty({ type: Boolean })
  status: boolean;
}

export class SubmissionHistoryResponse implements GradeSubmission {
  @Expose()
  @ApiProperty({ example: 4, description: "ID của lượt submit" })
  @IsNumber()
  id: number;

  @Expose()
  @ApiProperty({ example: 5, description: "ID của đợt mở lớp (Course Offer)" })
  @IsNumber()
  courseOfferId: number;

  @Expose()
  @ApiProperty({
    enum: GradeSubmissionStatus,
    example: GradeSubmissionStatus.PENDING,
    description: "Trạng thái phê duyệt điểm",
  })
  @IsEnum(GradeSubmissionStatus)
  status: GradeSubmissionStatus;

  @Expose()
  @ApiProperty({ example: 5, description: "ID người tạo submit" })
  @IsNumber()
  submitedBy: number;

  @Expose()
  @ApiProperty({
    example: null,
    description: "ID người phê duyệt",
    nullable: true,
  })
  @IsNumber()
  @IsOptional()
  approvedBy: number | null;

  @Expose()
  @ApiProperty({ example: "2026-05-19T07:05:59.648Z", description: "Ngày tạo" })
  @IsDate()
  createdAt: Date;

  @Expose()
  @ApiProperty({
    example: null,
    description: "Ngày cập nhật cuối",
    nullable: true,
  })
  @IsDate()
  @IsOptional()
  updatedAt: Date | null;

  @Expose()
  @ApiProperty({
    type: () => GradeEntryResponseDto,
    isArray: true,
    description: "Danh sách điểm chi tiết đi kèm",
  })
  @IsArray()
  @ValidateNested({ each: true }) // Validate từng phần tử trong mảng
  @Type(() => GradeEntryResponseDto) // Ép kiểu object sang Class DTO khi serialize/deserialize
  gradeEntries: GradeEntryResponseDto[];
}
