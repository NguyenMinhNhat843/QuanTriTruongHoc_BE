import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import {
  CreateFeeInvoiceDto,
  UpdateFeeInvoiceDto,
  SearchFeeInvoiceDto,
  FeeInvoiceDto,
  FeeInvoiceWithPaymentsDto,
  FeeInvoiceWithStudentDto,
  ResponseFeeInvoicePagination,
} from "../dto/fee-invoice.dto";
import { FeeInvoiceService } from "../service/fee-invoice.service";
import { JwtAuthGuard } from "../../auth/guard/jwt-auth.guard";
import { GetUser } from "../../common/decorators/get-user.decorator";
import { AuthUserResponseDto } from "../../auth/dto/auth-user-response.dto";

@ApiTags("Fee Invoice (Hóa đơn học phí)")
@ApiBearerAuth()
@Controller("fee-invoices")
@UseGuards(JwtAuthGuard)
export class FeeInvoiceController {
  constructor(private readonly feeInvoiceService: FeeInvoiceService) {}

  // ==========================================
  // 1. POST - TẠO MỚI HÓA ĐƠN
  // ==========================================
  @Post()
  @ApiOperation({
    summary: "Tạo mới hóa đơn học phí",
    description:
      "Tạo hóa đơn học phí cho sinh viên. Hệ thống tự động ghi nhận 1 giao dịch (Payment) ban đầu nếu số tiền đã đóng (paidAmount) lớn hơn 0.",
  })
  @ApiCreatedResponse({
    description: "Tạo hóa đơn học phí thành công.",
    type: FeeInvoiceDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Dữ liệu đầu vào không hợp lệ hoặc sai định dạng.",
  })
  async create(
    @Body() createDto: CreateFeeInvoiceDto,
    @GetUser() user: AuthUserResponseDto,
  ): Promise<FeeInvoiceDto> {
    return this.feeInvoiceService.create(createDto, user);
  }

  // ==========================================
  // 2. GET - TÌM KIẾM / LẤY DANH SÁCH
  // ==========================================
  @Get()
  @ApiOperation({
    summary: "Tìm kiếm hoặc Lấy danh sách hóa đơn học phí theo bộ lọc",
  })
  @ApiOkResponse({
    description: "Trả về danh sách hóa đơn học phí phù hợp với bộ lọc.",
    type: ResponseFeeInvoicePagination,
  })
  async findAll(
    @Query() searchDto: SearchFeeInvoiceDto,
  ): Promise<ResponseFeeInvoicePagination> {
    return this.feeInvoiceService.findAll(searchDto);
  }

  @Get("periods/:periodId/students/:identifier/debt")
  @ApiOperation({
    summary: "Lấy chi tiết công nợ học phí của sinh viên theo đợt học phí",
  })
  @ApiResponse({
    status: 200,
    description:
      "Trả về chi tiết hóa đơn, thông tin sinh viên và lịch sử thanh toán lẻ.",
    type: FeeInvoiceWithStudentDto,
  })
  async getStudentDebt(
    @Param("periodId", ParseIntPipe) periodId: number,
    @Param("identifier") identifier: string,
  ) {
    return await this.feeInvoiceService.getStudentDebtDetails(
      identifier,
      periodId,
    );
  }

  // ==========================================
  // 3. GET - LẤY CHI TIẾT HÓA ĐƠN
  // ==========================================
  @Get(":id")
  @ApiOperation({
    summary: "Lấy thông tin chi tiết một hóa đơn học phí theo ID",
  })
  @ApiOkResponse({
    description: "Tìm thấy hóa đơn học phí.",
    type: FeeInvoiceWithPaymentsDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Hóa đơn học phí không tồn tại.",
  })
  async findOne(
    @Param("id", ParseIntPipe) id: number,
  ): Promise<FeeInvoiceWithPaymentsDto> {
    return this.feeInvoiceService.findOne(id);
  }

  // ==========================================
  // 4. PATCH - CẬP NHẬT HÓA ĐƠN
  // ==========================================
  @Patch(":id")
  @ApiOperation({
    summary: "Cập nhật thông tin hóa đơn học phí",
    description:
      "Cập nhật các trường dữ liệu của hóa đơn. Nếu số tiền đã đóng (paidAmount) tăng lên so với trước, hệ thống tự tạo thêm 1 lịch sử giao dịch (Payment) tương ứng với phần chênh lệch.",
  })
  @ApiOkResponse({
    description: "Cập nhật thông tin hóa đơn học phí thành công.",
    type: FeeInvoiceDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Dữ liệu cập nhật không hợp lệ.",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Hóa đơn học phí cần cập nhật không tồn tại.",
  })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateFeeInvoiceDto,
  ): Promise<FeeInvoiceDto> {
    return this.feeInvoiceService.update(id, updateDto);
  }

  // ==========================================
  // 5. DELETE - XÓA HÓA ĐƠN
  // ==========================================
  @Delete(":id")
  @ApiOperation({
    summary: "Xóa hóa đơn học phí theo ID",
    description:
      "Xóa hóa đơn học phí đồng thời dọn sạch các lịch sử giao dịch (Payments) liên quan tới hóa đơn này.",
  })
  @ApiOkResponse({
    description: "Xóa thành công hóa đơn học phí.",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example:
            "Xóa thành công hóa đơn học phí và toàn bộ lịch sử thanh toán của ID 1",
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Hóa đơn học phí cần xóa không tồn tại.",
  })
  async remove(
    @Param("id", ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    return this.feeInvoiceService.remove(id);
  }
}
