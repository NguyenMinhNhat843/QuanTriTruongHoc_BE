import { ApiProperty, OmitType, PartialType, PickType } from "@nestjs/swagger";
import { IsDate, IsInt, IsNumber, IsString, Min } from "class-validator";
import { FeeInvoice } from "../../../prisma/generated/prisma/client";

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

// 2. Create DTO: Loại bỏ các trường tự sinh (id, createdAt, updatedAt) và trạng thái mặc định (status)
export class CreateFeeInvoiceDto extends OmitType(FeeInvoiceDto, [
  "id",
  "status",
  "createdAt",
  "updatedAt",
] as const) {}

// 3. Update DTO: Kế thừa từ Create DTO nhưng tất cả các trường đều là optional
export class UpdateFeeInvoiceDto extends PartialType(CreateFeeInvoiceDto) {}

// 4. Search DTO: Tìm kiếm theo học sinh (studentId), đợt thu (periodId) hoặc trạng thái hóa đơn (status)
export class SearchFeeInvoiceDto extends PickType(FeeInvoiceDto, [
  "studentId",
  "periodId",
  "status",
] as const) {}
