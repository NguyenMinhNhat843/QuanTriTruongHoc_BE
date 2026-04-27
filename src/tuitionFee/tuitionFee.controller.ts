import { Body, Controller, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { TuitionFeeService } from "./tuitionFee.service";
import { EnrollmentPaymentDto } from "./tuitionFee.dto";

@ApiTags("Tuition Fee (Thu học phí)")
@Controller("tuition-fee")
export class TuitionFeeController {
  constructor(private readonly tuitionFeeService: TuitionFeeService) {}

  @Get("enrollment-fees-preview")
  @ApiOperation({
    summary: "Lấy danh sách các khoản phí nhập học cần đóng",
    description:
      "Tính toán và trả về chi tiết các môn học, tín chỉ, đơn giá và các loại phí dịch vụ đi kèm.",
  })
  @ApiResponse({ status: 200, description: "Lấy danh sách thành công." })
  async getEnrollmentFeesPreview(@Query() data: EnrollmentPaymentDto) {
    // Lưu ý: Dùng @Query vì đây là phương thức GET để lấy thông tin
    return await this.tuitionFeeService.getInitialEnrollmentFees(data);
  }
}
