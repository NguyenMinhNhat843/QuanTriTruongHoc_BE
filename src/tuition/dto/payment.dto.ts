import { ApiProperty, OmitType, PartialType, PickType } from "@nestjs/swagger";
import {
  IsDate,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { Payment } from "../../../prisma/generated/prisma/client";

// 1. Base DTO chứa đầy đủ các thuộc tính phẳng từ Model (Lược bỏ các quan hệ invoice, student, allocations, logs)
export class PaymentDto implements Omit<
  Payment,
  "invoice" | "student" | "allocations" | "logs"
> {
  @ApiProperty()
  @IsInt()
  id: number;

  @ApiProperty()
  @IsInt()
  invoiceId: number;

  @ApiProperty()
  @IsInt()
  studentId: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  amountPaid: number;

  @ApiProperty()
  @IsDate()
  paymentDate: Date;

  @ApiProperty()
  @IsString()
  method: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  transactionRef: string | null;

  @ApiProperty()
  @IsString()
  status: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  createdBy: string | null;
}

// 2. Create DTO: Loại bỏ trường tự sinh (id), thời gian (paymentDate) và trạng thái mặc định thường do hệ thống gán ban đầu
export class CreatePaymentDto extends OmitType(PaymentDto, [
  "id",
  "paymentDate",
  "status",
] as const) {}

// 3. Update DTO: Kế thừa từ Create DTO nhưng tất cả các trường đều là optional
export class UpdatePaymentDto extends PartialType(CreatePaymentDto) {}

// 4. Search DTO: Tìm kiếm theo hóa đơn (invoiceId), học sinh (studentId), phương thức (method) hoặc trạng thái giao dịch (status)
export class SearchPaymentDto extends PickType(PaymentDto, [
  "invoiceId",
  "studentId",
  "method",
  "status",
] as const) {}
