import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class SemesterResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "HK1-2026" })
  name: string;

  @ApiProperty({ example: "2025-2026" })
  schoolYear: string;

  @ApiProperty({ example: "2026-09-01" })
  startDate: Date;

  @ApiProperty({ example: "2027-01-15" })
  endDate: Date;

  @ApiProperty({ example: false })
  isCurrent: boolean;

  @ApiProperty({ example: "2024-04-25T10:00:00Z" })
  createdAt: Date;

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

  constructor(partial: any) {
    this.id = partial.id;
    this.name = partial.name;
    this.schoolYear = partial.schoolYear;
    this.startDate = partial.startDate;
    this.endDate = partial.endDate;
    this.isCurrent = partial.isCurrent;
    this.createdAt = partial.createdAt;

    // Map số lượng quan hệ từ Prisma _count (nếu có dùng trong service)
    if (partial._count) {
      this.courseOfferCount = partial._count.courseOffers;
      this.feeInvoiceCount = partial._count.feeInvoices;
    }
  }
}
