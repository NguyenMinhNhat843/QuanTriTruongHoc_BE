import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { TuitionFeeService } from "./tuitionFee.service";

@ApiTags("Tuition Fee (Thu học phí)")
@Controller("tuition-fee")
export class TuitionFeeController {
  constructor(private readonly tuitionFeeService: TuitionFeeService) {}

  @Get("/test/:studentId")
  async test(@Param("studentId", ParseIntPipe) studentId: number) {
    return await this.tuitionFeeService.processInitialEnrollmentPayment(
      studentId,
    );
  }
}
