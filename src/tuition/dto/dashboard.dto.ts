import { ApiProperty } from "@nestjs/swagger";

export class KpiResponseDto {
  @ApiProperty() totalInvoices: number;
  @ApiProperty() totalBilled: number;
  @ApiProperty() totalCollected: number;
  @ApiProperty() totalOutstanding: number;
  @ApiProperty() collectionRate: number;
}

export class StatusDistributionDto {
  @ApiProperty() status: string;
  @ApiProperty() count: number;
  @ApiProperty() amount: number;
}

export class PaymentMethodDistributionDto {
  @ApiProperty() method: string;
  @ApiProperty() count: number;
  @ApiProperty() amount: number;
}

class StudentNestedDto {
  @ApiProperty() id: number;
}

export class RecentPaymentDto {
  @ApiProperty() id: number;
  @ApiProperty() amountPaid: number;
  @ApiProperty() paymentDate: Date;
  @ApiProperty() method: string;
  @ApiProperty({ type: StudentNestedDto }) student: StudentNestedDto;
}

export class TopDebtorDto {
  @ApiProperty() id: number;
  @ApiProperty() remainingAmount: number;
  @ApiProperty() status: string;
  @ApiProperty({ type: StudentNestedDto }) student: StudentNestedDto;
}

export class TuitionOverviewResponseDto {
  @ApiProperty({ type: KpiResponseDto }) kpis: KpiResponseDto;
  @ApiProperty({ type: [StatusDistributionDto] })
  statusDistribution: StatusDistributionDto[];
  @ApiProperty({ type: [PaymentMethodDistributionDto] })
  paymentMethods: PaymentMethodDistributionDto[];
  @ApiProperty({ type: [RecentPaymentDto] }) recentPayments: RecentPaymentDto[];
  @ApiProperty({ type: [TopDebtorDto] }) topDebtors: TopDebtorDto[];
}

export class PaymentTrendResponseDto {
  @ApiProperty() date: Date;
  @ApiProperty() dailyAmount: number;
}
