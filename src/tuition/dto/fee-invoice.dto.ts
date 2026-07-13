import { ApiProperty, OmitType, PartialType, PickType } from "@nestjs/swagger";
import { IsDate, IsInt, IsNumber, IsString, Min } from "class-validator";
import { FeeInvoice } from "../../../prisma/generated/prisma/client";
import { PaymentDto } from "./payment.dto";
import { StudentDto } from "../../student/dto/student.dto";
import { MajorDto } from "../../major/major.dto";
import { BatchDto } from "../../batch/batch.dto";
import { ClassDto } from "../../class/class.dto";

// 1. Base DTO chứa đầy đủ các thuộc tính phẳng từ Model (Lược bỏ các quan hệ student, period, items, payments)
export class FeeInvoiceDto implements Omit<
  FeeInvoice,
  "student" | "period" | "items" | "payments"
> {
  @ApiProperty()
  @IsInt()
  id: number;

  @ApiProperty()
  @IsInt()
  studentId: number;

  @ApiProperty()
  @IsInt()
  periodId: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  minRequiredAmount: number;

  @ApiProperty()
  @IsNumber()
  paidAmount: number;

  @ApiProperty()
  @IsNumber()
  remainingAmount: number;

  @ApiProperty()
  @IsString()
  status: string;

  @ApiProperty()
  @IsDate()
  createdAt: Date;

  @ApiProperty()
  @IsDate()
  updatedAt: Date;
}

export class FeeInvoiceWithPaymentsDto extends FeeInvoiceDto {
  @ApiProperty({ type: [PaymentDto] })
  payments: PaymentDto[];
}

// 2. Create DTO: Loại bỏ các trường tự sinh (id, createdAt, updatedAt) và trạng thái mặc định (status)
export class CreateFeeInvoiceDto extends OmitType(FeeInvoiceDto, [
  "id",
  "status",
  "createdAt",
  "updatedAt",
] as const) {
  @ApiProperty({
    required: false,
    description: "Phương thức thanh toán (nếu có)",
  })
  paymentMethod?: string;

  @ApiProperty({
    required: false,
    description: "Mã giao dịch thanh toán (nếu có)",
  })
  transactionRef?: string;

  @ApiProperty({
    required: false,
    description: "Tên nhân viên thực hiện giao dịch (nếu có)",
  })
  staffName?: string;
}

// 3. Update DTO: Kế thừa từ Create DTO nhưng tất cả các trường đều là optional
export class UpdateFeeInvoiceDto extends PartialType(CreateFeeInvoiceDto) {}

// 4. Search DTO: Tìm kiếm theo học sinh (studentId), đợt thu (periodId) hoặc trạng thái hóa đơn (status)
export class SearchFeeInvoiceDto extends PartialType(
  PickType(FeeInvoiceDto, ["studentId", "periodId", "status"]),
) {
  @ApiProperty({ required: false, default: 1 })
  page?: number;

  @ApiProperty({ required: false, default: 10 })
  limit?: number;
}

export class ResponseStudentDebtDto extends StudentDto {
  @ApiProperty({ type: MajorDto, nullable: true })
  major?: MajorDto;

  @ApiProperty({ type: BatchDto, nullable: true })
  batch?: BatchDto;

  @ApiProperty({ type: ClassDto, nullable: true })
  class?: ClassDto;
}

export class FeeInvoiceWithStudentDto extends FeeInvoiceDto {
  @ApiProperty({ type: ResponseStudentDebtDto, nullable: true })
  student?: ResponseStudentDebtDto;

  @ApiProperty({ type: [PaymentDto] })
  payments?: PaymentDto[];
}

export class ResponseFeeInvoicePagination {
  @ApiProperty({ type: [FeeInvoiceDto] })
  data: FeeInvoiceDto[];

  @ApiProperty({ type: Number })
  total: number;
}
