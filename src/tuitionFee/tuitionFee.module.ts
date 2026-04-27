import { Module } from "@nestjs/common";
import { TuitionFeeService } from "./tuitionFee.service";
import { TuitionFeeController } from "./tuitionFee.controller";

@Module({
  imports: [],
  controllers: [TuitionFeeController],
  providers: [TuitionFeeService],
  exports: [TuitionFeeService],
})
export class TuitionFeeModule {}
