import { ApiProperty } from "@nestjs/swagger";

// ==========================
// 1. NHÓM LỚP HỌC & SĨ SỐ
// ==========================
class OverloadedClassDto {
  @ApiProperty({ example: "CNTTK1A", description: "Tên lớp học" })
  className: string;

  @ApiProperty({
    example: "42/40",
    description: "Sĩ số hiện tại / Sĩ số tối đa",
  })
  size: string;
}

class ClassroomsStatsDto {
  @ApiProperty({ example: 25, description: "Tổng số lớp học đang hoạt động" })
  totalActiveClasses: number;

  @ApiProperty({ example: 84.5, description: "Tỷ lệ lấp đầy toàn trường (%)" })
  schoolFillRate: number;

  @ApiProperty({
    example: 2,
    description: "Số lượng lớp đang bị quá tải sĩ số",
  })
  overloadedClassesCount: number;

  @ApiProperty({
    type: [OverloadedClassDto],
    description: "Danh sách chi tiết các lớp quá tải",
  })
  overloadedClasses: OverloadedClassDto[];

  @ApiProperty({
    example: 850,
    description: "Tổng số học sinh hiện tại toàn trường",
  })
  totalCurrentStudents: number;

  @ApiProperty({
    example: 1000,
    description: "Tổng chỉ tiêu/sức chứa tối đa toàn trường",
  })
  totalMaxStudents: number;
}

// ==========================
// 2. NHÓM TÀI CHÍNH & HỌC PHÍ
// ==========================
class FinanceMetricsDto {
  @ApiProperty({
    example: 2500000000,
    description: "Tổng số tiền đã phát hành hóa đơn (phải thu)",
  })
  totalInvoiced: number;

  @ApiProperty({
    example: 1850000000,
    description: "Tổng số tiền thực tế đã thu thành công",
  })
  totalCollected: number;

  @ApiProperty({
    example: 650000000,
    description: "Tổng số tiền sinh viên còn nợ",
  })
  totalRemaining: number;

  @ApiProperty({
    example: 74.0,
    description: "Tỷ lệ hoàn thành thu học phí của đợt (%)",
  })
  collectionRate: number;

  @ApiProperty({
    example: 850,
    description: "Tổng số lượng hóa đơn học phí đã phát hành",
  })
  totalInvoicesCount: number;
}

class InvoiceStatusDistributionDto {
  @ApiProperty({ example: 150, description: "Số lượng hóa đơn chưa đóng" })
  unpaid: number;

  @ApiProperty({
    example: 80,
    description: "Số lượng hóa đơn mới đóng một phần",
  })
  partial: number;

  @ApiProperty({
    example: 620,
    description: "Số lượng hóa đơn đã hoàn thành nghĩa vụ",
  })
  paid: number;
}

class RecentPaymentDto {
  @ApiProperty({ example: 12, description: "ID của giao dịch thanh toán" })
  id: number;

  @ApiProperty({ example: "Nguyễn Văn A", description: "Họ và tên học sinh" })
  studentName: string;

  @ApiProperty({ example: "HS260105", description: "Mã số học sinh" })
  studentCode: string;

  @ApiProperty({
    example: 6500000,
    description: "Số tiền đóng trong lần giao dịch này",
  })
  amountPaid: number;

  @ApiProperty({
    example: "2026-07-15T10:30:00.000Z",
    description: "Thời gian thực hiện giao dịch",
  })
  paymentDate: Date;

  @ApiProperty({
    example: "BANK_TRANSFER",
    description: "Phương thức nộp tiền (CASH, BANK_TRANSFER, VNPAY,...)",
  })
  method: string;
}

class FinanceAnalyticsDto {
  @ApiProperty({
    example: "Đợt thu học phí Học kỳ 1 - 2026",
    description: "Tên đợt thu học phí hiện tại",
  })
  periodName: string;

  @ApiProperty({
    example: "2026-06-01T00:00:00.000Z",
    description: "Ngày bắt đầu thu",
  })
  startDate: Date;

  @ApiProperty({
    example: "2026-07-31T23:59:59.000Z",
    description: "Hạn chót đóng tiền",
  })
  endDate: Date;

  @ApiProperty({
    type: FinanceMetricsDto,
    description: "Các chỉ số doanh thu tài chính",
  })
  metrics: FinanceMetricsDto;

  @ApiProperty({
    type: InvoiceStatusDistributionDto,
    description: "Phân phối trạng thái đóng tiền của học sinh",
  })
  statusDistribution: InvoiceStatusDistributionDto;

  @ApiProperty({
    type: [RecentPaymentDto],
    description: "Top 5 giao dịch thành công gần đây nhất",
  })
  recentPayments: RecentPaymentDto[];
}

// ==========================
// 3. DTO ĐẦU RA CHÍNH
// ==========================
export class AdvancedAnalyticsResponseDto {
  @ApiProperty({
    example: "HK1 2026-2027",
    description: "Tên học kỳ hoạt động hiện tại",
  })
  semesterName: string;

  @ApiProperty({
    type: ClassroomsStatsDto,
    description: "Dữ liệu thống kê về vận hành lớp học",
  })
  classrooms: ClassroomsStatsDto;

  @ApiProperty({
    type: FinanceAnalyticsDto,
    nullable: true,
    description:
      "Thông tin chi tiết về tài chính & dòng tiền học phí (Trả về null nếu chưa thiết lập hoặc chưa kích hoạt đợt đóng học phí nào)",
  })
  finance: FinanceAnalyticsDto | null;
}
