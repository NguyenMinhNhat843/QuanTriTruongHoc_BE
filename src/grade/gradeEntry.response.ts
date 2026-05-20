import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsNotEmpty } from "class-validator";
import { Type } from "class-transformer";
import {
  GradeEntry,
  GradeSubmissionStatus,
} from "../../prisma/generated/prisma/client";

export class GradeEntryResponseDto implements GradeEntry {
  @ApiProperty({
    example: 1,
    description: "ID tự tăng của bản ghi điểm số",
  })
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @ApiPropertyOptional({
    example: 19,
    description:
      "ID của đơn phê duyệt điểm (GradeSubmission), có thể null nếu điểm dạng nháp chưa nộp",
    nullable: true,
    type: Number,
  })
  @IsNumber()
  @IsOptional()
  gradeSubmissionId: number | null;

  @ApiProperty({
    example: 2,
    description:
      "ID của thành phần điểm (Ví dụ: Điểm chuyên cần, Điểm giữa kỳ...)",
  })
  @IsNumber()
  @IsNotEmpty()
  componentId: number;

  @ApiPropertyOptional({
    example: 154,
    description:
      "ID lượt đăng ký học phần của sinh viên (Liên kết với bảng CourseRegistration)",
    nullable: true,
    type: Number,
  })
  @IsNumber()
  @IsOptional()
  courseRegistrationId: number | null;

  @ApiPropertyOptional({
    example: 8.5,
    description:
      "Điểm số của học sinh (Thang điểm hệ 10), có thể null nếu chưa nhập điểm",
    nullable: true,
    minimum: 0,
    maximum: 10,
    type: Number,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  score: number | null;

  @ApiPropertyOptional({
    example: "APPROVED",
    nullable: true,
    enum: GradeSubmissionStatus,
  })
  @IsOptional()
  status: GradeSubmissionStatus | null;
}
