import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsNumber,
  IsString,
  IsDate,
  IsPositive,
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsEnum,
  Min,
} from "class-validator";

export class TuitionPreviewResponseDto {
  @ApiProperty({
    example: "HK1 - 2026",
    description: "Tên học kỳ hiện tại dùng để tính toán preview",
  })
  @IsString()
  @IsNotEmpty()
  semesterName: string;

  @ApiProperty({
    example: 1284,
    description: "Tổng số sinh viên dự kiến sẽ được lập hóa đơn",
  })
  @IsNumber()
  totalStudents: number;

  @ApiProperty({
    example: 14220,
    description: "Tổng số tín chỉ của tất cả sinh viên trong đợt này",
  })
  @IsNumber()
  totalCredits: number;

  @ApiProperty({
    example: 12800000000,
    description: "Tổng số tiền dự kiến thu được (VND)",
  })
  @IsNumber()
  @IsPositive()
  estimatedTotalAmount: number;

  @ApiProperty({
    example: 10000000,
    description: "Số tiền học phí trung bình trên mỗi sinh viên",
  })
  @IsNumber()
  averagePerStudent: number;

  @ApiProperty({
    example: "2026-05-14T10:58:00.000Z",
    description: "Thời điểm tạo thông số xem trước",
  })
  @IsDate()
  generatedAt: Date;
}

export enum FeeInvoiceItemStatus {
  PAID = "paid",
  UNPAID = "unpaid",
}
export type FeeInvoiceItemStatusString = "paid" | "unpaid";

export class TuitionFeeItemsDto {
  @ApiProperty({
    example: 1,
    description: "ID của payment",
  })
  @IsInt()
  id: number;

  @ApiProperty({
    enum: FeeInvoiceItemStatus,
    enumName: "FeeInvoiceItemStatus",
    example: FeeInvoiceItemStatus.PAID,
    description: "Trạng thái thanh toán",
  })
  @IsEnum(FeeInvoiceItemStatus)
  status: FeeInvoiceItemStatus;

  @ApiProperty({
    example: "Học phí học kỳ 1",
    description: "Tên khoản thanh toán",
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 3500000,
    description: "Số tiền",
  })
  @IsNumber()
  amount: number;

  @ApiProperty({
    example: 101,
    nullable: true,
    description: "ID sinh viên",
    required: false,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  studentId: number | null;

  @ApiProperty({
    example: 5001,
    nullable: true,
    description: "ID hóa đơn",
    required: false,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  invoiceId: number | null;

  @ApiProperty({
    example: 2,
    nullable: true,
    description: "ID học kỳ",
    required: false,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  semesterId: number | null;

  constructor(partial: Partial<TuitionFeeItemsDto>) {
    Object.assign(this, partial);
  }
}

export enum FeeInvoiceStatus {
  UNPAID = "unpaid",
  PARTIAL = "partial",
  PAID = "paid",
}

/**
 * 3. DTO bổ sung (Nghiệp vụ nâng cao): Nếu bạn muốn tạo Hóa đơn kèm sẵn danh sách các Item con bên trong
 */
export class MiniFeeInvoiceItemDto {
  @ApiProperty({
    example: "Học phí môn Lập trình Web",
    description: "Tên khoản phí",
  })
  @IsString()
  name: string;

  @ApiProperty({ example: 1200000, description: "Số tiền của khoản này" })
  @IsNumber()
  @Min(0)
  amount: number;
}

// Invoice Dto
export class InvoiceDto {
  @ApiProperty({
    example: 1,
    description: "ID của sinh viên thuộc hóa đơn này",
    type: Number,
  })
  @IsInt({ message: "studentId phải là số nguyên" })
  @Min(1, { message: "studentId không hợp lệ" })
  studentId: number;

  @ApiProperty({
    example: 2,
    description: "ID của học kỳ áp dụng hóa đơn",
    type: Number,
  })
  @IsInt({ message: "semesterId phải là số nguyên" })
  @Min(1, { message: "semesterId không hợp lệ" })
  semesterId: number;

  @ApiProperty({
    example: 15500000.5,
    description: "Tổng số tiền phải đóng của cả kỳ",
    type: Number,
  })
  @IsNumber({}, { message: "totalAmount phải là một số thực hợp lý" })
  @Min(0, { message: "Tổng tiền phải lớn hơn hoặc bằng 0" })
  totalAmount: number;

  @ApiPropertyOptional({
    example: FeeInvoiceStatus.UNPAID,
    enum: FeeInvoiceStatus,
    description: "Trạng thái thanh toán của hóa đơn",
    default: FeeInvoiceStatus.UNPAID,
  })
  @IsOptional()
  @IsEnum(FeeInvoiceStatus, {
    message: "Trạng thái hóa đơn không hợp lệ (unpaid, partial, paid)",
  })
  status?: string | null;

  @ApiProperty({
    example: "2026-05-14T10:58:00.000Z",
    description: "Thời điểm tạo hóa đơn",
  })
  @IsDate()
  createdAt: Date;

  constructor(partial: Partial<InvoiceDto>) {
    Object.assign(this, partial);
  }
}
