import { Module } from "@nestjs/common";
import { FeeInvoiceController } from "./controller/fee-invoice.controller";
import { TuitionPeriodController } from "./controller/tuition-period.controller";
import { TuitionConfigController } from "./controller/tuition-config.controller";
import { FeeInvoiceService } from "./service/fee-invoice.service";
import { PaymentService } from "./service/payment.service";
import { TuitionConfigService } from "./service/tuition-config.service";
import { TuitionPeriodService } from "./service/tuition-period.service";

@Module({
  imports: [],
  controllers: [
    FeeInvoiceController,
    TuitionPeriodController,
    TuitionConfigController,
  ],
  providers: [
    FeeInvoiceService,
    PaymentService,
    TuitionConfigService,
    TuitionPeriodService,
  ],
  exports: [
    FeeInvoiceService,
    PaymentService,
    TuitionConfigService,
    TuitionPeriodService,
  ],
})
export class TuitionModule {}
