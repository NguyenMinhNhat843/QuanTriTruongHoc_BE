import { Module } from "@nestjs/common";
import { FeeService } from "./fee.service";
import { FeeController } from "./fee.controller";

@Module({
  controllers: [FeeController],
  providers: [FeeService],
  exports: [FeeService], // Export nếu bạn cần dùng ở Module khác (như PaymentModule)
})
export class FeeModule {}
