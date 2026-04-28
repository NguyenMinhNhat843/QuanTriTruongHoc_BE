import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { TuitionFeeService } from "./tuitionFee.service";
import { PayTuitionFeeDto } from "./tuitionFee.dto";

@ApiTags("Tuition Fee (Thu học phí)")
@Controller("tuition-fee")
export class TuitionFeeController {
  constructor(private readonly tuitionFeeService: TuitionFeeService) {}

  @Post("create-semester-fees")
  @ApiOperation({
    summary: "Tạo các khoản phí học kỳ cho sinh viên",
  })
  @ApiResponse({ status: 201, description: "Tạo các khoản phí thành công." })
  async createSemesterFees() {
    return await this.tuitionFeeService.createTuitionFees();
  }

  @Get("/fees/:studentId")
  @ApiOperation({
    summary: "Lấy danh sách các khoản phí học kỳ của sinh viên",
    description:
      "Dựa trên ID sinh viên, lấy danh sách các khoản phí học kỳ đã tạo.",
  })
  @ApiResponse({
    status: 200,
    description: "Danh sách các khoản phí học kỳ của sinh viên.",
  })
  async getTuitionFees(@Query("studentId") studentId: number) {
    return await this.tuitionFeeService.getTuitionFees(studentId);
  }

  @Post("/pay")
  @ApiOperation({
    summary: "Thanh toán học phí",
    description:
      "Sinh viên thực hiện thanh toán học phí dựa trên danh sách các khoản phí đã tạo.",
  })
  async payTuitionFee(@Body() data: PayTuitionFeeDto) {
    return await this.tuitionFeeService.payTuitionFee(data);
  }
}
