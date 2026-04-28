import { Module } from "@nestjs/common";
import { CreditPriceController } from "./creditPrice.controller";
import { CreditPriceService } from "./creditPrice.service";

@Module({
  controllers: [CreditPriceController],
  providers: [CreditPriceService],
  exports: [CreditPriceService],
})
export class CreditPriceModule {}
