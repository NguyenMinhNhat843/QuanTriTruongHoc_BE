import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { TuitionFeeService } from "./tuitionFee.service";
import { PayTuitionFeeDto, SearchTuitionDto } from "./tuitionFee.dto";
import {
  InvoiceDto,
  TuitionFeeItemsDto,
  TuitionPreviewResponseDto,
} from "./tuitionFee.response";

@ApiTags("Tuition Fee (Thu học phí)")
@Controller("tuition-fee")
export class TuitionFeeController {
  constructor(private readonly tuitionFeeService: TuitionFeeService) {}

  @Delete("/delete-all")
  @ApiOperation({
    summary: "Xóa tất cả dữ liệu học phí",
    description:
      "Dùng cho mục đích testing, xóa tất cả feeInvoice và feeInvoiceItem",
  })
  async deleteAll() {
    await this.tuitionFeeService.deleteAll();
  }

  @Get("preview")
  @ApiOperation({ summary: "Xem trước thông số học phí dự kiến" })
  @ApiResponse({
    type: TuitionPreviewResponseDto,
    status: 200,
    description: "Thông số học phí dự kiến cho đợt học phí sắp mở.",
  })
  async getPreview() {
    return await this.tuitionFeeService.previewTuitionFees();
  }

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
    summary: "Lấy danh sách các hóa đơn của sinh viên",
    description:
      "Dựa trên ID sinh viên, lấy danh sách các khoản phí học kỳ đã tạo.",
  })
  @ApiResponse({
    status: 200,
    description: "Danh sách các khoản phí học kỳ của sinh viên.",
    type: [TuitionFeeItemsDto],
  })
  async getTuitionFees(@Param("studentId") studentId: number) {
    return await this.tuitionFeeService.getTuitionFees(studentId);
  }

  // Lấy danh sách hóa đơn của học sinh
  @Get("/invoices/:studentCode")
  @ApiOperation({
    summary: "Lấy danh sách hóa đơn học phí của sinh viên",
    description:
      "Dựa trên mã sinh viên, lấy danh sách các hóa đơn học phí đã tạo.",
  })
  @ApiResponse({
    type: [InvoiceDto],
  })
  async getTuitionInvoiceByStudentCode(
    @Param("studentCode") studentCode: string,
  ) {
    return await this.tuitionFeeService.getTuitionInvoiceByStudentCode(
      studentCode,
    );
  }

  // get all
  @Get("/fees")
  @ApiOperation({
    summary: "Lấy tất cả các khoản phí học kỳ của tất cả sinh viên",
    description: "Lấy danh sách tất cả các khoản phí học kỳ đã tạo.",
  })
  @ApiResponse({
    status: 200,
    description: "Danh sách tất cả các khoản phí học kỳ.",
  })
  async getAllTuitionFees() {
    return await this.tuitionFeeService.getAllTuitionFees();
  }

  @Get("/student-tuition")
  @ApiOperation({
    summary: "Lấy thông tin học phí của sinh viên",
    description:
      "Dựa trên các tiêu chí tìm kiếm, lấy thông tin học phí của sinh viên.",
  })
  async getStudentTuition(@Query() query: SearchTuitionDto) {
    return await this.tuitionFeeService.getStudentTuition(query);
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
