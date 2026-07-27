import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Semester, SemesterStatus } from "../../prisma/generated/prisma/client";

export class SemesterResponseDto implements Semester {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "HK1-2026" })
  name: string;

  @ApiProperty({ example: 2025 })
  year: number;

  @ApiProperty({ example: 1 })
  term: number;

  @ApiProperty({ example: "2025-2026" })
  schoolYear: string;

  @ApiProperty({ type: Number, nullable: true })
  academicYearId: number | null;

  @ApiProperty({ example: "2026-09-01" })
  startDate: Date;

  @ApiProperty({ example: "2027-01-15" })
  endDate: Date;

  @ApiProperty({ example: false })
  isCurrent: boolean;

  @ApiProperty({ example: "2024-04-25T10:00:00Z" })
  createdAt: Date;

  @ApiPropertyOptional({
    type: () => SemesterStatus,
  })
  status: SemesterStatus | null;

  @ApiPropertyOptional({ type: Number })
  teachingWeeks: number | null;

  // --- Dữ liệu thống kê quan hệ ---
  @ApiPropertyOptional({
    example: 5,
    description: "Số lượng đợt mở lớp trong học kỳ này",
  })
  courseOfferCount?: number;

  @ApiPropertyOptional({
    example: 100,
    description: "Số lượng hóa đơn học phí",
  })
  feeInvoiceCount?: number;
}
