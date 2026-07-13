import { Module } from "@nestjs/common";
import { FeeInvoiceController } from "./controller/fee-invoice.controller";
import { TuitionPeriodController } from "./controller/tuition-period.controller";
import { TuitionConfigController } from "./controller/tuition-config.controller";
import { FeeInvoiceService } from "./service/fee-invoice.service";
import { PaymentService } from "./service/payment.service";
import { TuitionConfigService } from "./service/tuition-config.service";
import { TuitionPeriodService } from "./service/tuition-period.service";
import { DashboardController } from "./controller/dashboard.controller";
import { DashboardService } from "./service/dashboard.service";

@Module({
  imports: [],
  controllers: [
    FeeInvoiceController,
    TuitionPeriodController,
    TuitionConfigController,
    DashboardController,
  ],
  providers: [
    FeeInvoiceService,
    PaymentService,
    TuitionConfigService,
    TuitionPeriodService,
    DashboardService,
  ],
  exports: [
    FeeInvoiceService,
    PaymentService,
    TuitionConfigService,
    TuitionPeriodService,
    DashboardService,
  ],
})
export class TuitionModule {}
