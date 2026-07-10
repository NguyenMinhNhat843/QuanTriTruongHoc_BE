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
  HttpCode,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiOkResponse,
  ApiCreatedResponse,
} from "@nestjs/swagger";
import {
  CreateTuitionConfigDto,
  UpdateTuitionConfigDto,
  SearchTuitionConfigDto,
  TuitionConfigWithItemsDto,
} from "../dto/tuition-config.dto"; // Điều chỉnh lại đường dẫn
import { TuitionConfigService } from "../service/tuition-config.service";
import { MajorDto } from "../../major/major.dto";

@ApiTags("Tuition Config (Cấu hình học phí)") // Nhóm các API này lại trên Swagger UI
@Controller("tuition-configs")
export class TuitionConfigController {
  constructor(private readonly tuitionConfigService: TuitionConfigService) {}

  // ==========================================
  // 1. POST - TẠO MỚI
  // ==========================================
  @Post()
  @ApiOperation({
    summary: "Tạo mới cấu hình học phí kèm danh sách các khoản mục (items)",
  })
  @ApiCreatedResponse({
    description: "Tạo mới cấu hình học phí thành công.",
    type: TuitionConfigWithItemsDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Dữ liệu đầu vào không hợp lệ.",
  })
  async create(
    @Body() createDto: CreateTuitionConfigDto,
  ): Promise<TuitionConfigWithItemsDto> {
    return this.tuitionConfigService.create(createDto);
  }

  @Post(":id/sync-invoices")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Sinh công nợ thủ công (Đồng bộ hóa đơn học phí) cho sinh viên theo cấu hình",
  })
  @ApiResponse({
    status: 200,
    description: "Đồng bộ thành công công nợ sinh viên.",
  })
  async syncInvoices(@Param("id", ParseIntPipe) id: number) {
    return await this.tuitionConfigService.triggerManualGenerateInvoices(id);
  }

  // ==========================================
  // 2. GET - TÌM KIẾM / LẤY DANH SÁCH
  // ==========================================
  @Get()
  @ApiOperation({
    summary: "Lấy danh sách hoặc Tìm kiếm cấu hình học phí theo bộ lọc",
  })
  @ApiOkResponse({
    description: "Trả về danh sách cấu hình học phí phù hợp.",
    type: [TuitionConfigWithItemsDto], // Khai báo kiểu mảng trong Swagger
  })
  async findAll(
    @Query() searchDto: SearchTuitionConfigDto,
  ): Promise<TuitionConfigWithItemsDto[]> {
    return this.tuitionConfigService.findAll(searchDto);
  }

  // =========================================================================
  // GET - LẤY DANH SÁCH NGÀNH CHƯA CẤU HÌNH THEO ĐỢT HỌC PHÍ
  // =========================================================================
  @Get("unconfigured-majors")
  @ApiOperation({
    summary:
      "Lấy danh sách các ngành chưa được thiết lập học phí của đợt này (Phục vụ ô Select Dropdown)",
  })
  @ApiOkResponse({
    description: "Trả về mảng danh sách ngành học hợp lệ có thể cấu hình.",
    type: [MajorDto],
  })
  async getUnconfiguredMajors(
    @Query("periodId", ParseIntPipe) periodId: number,
  ): Promise<MajorDto[]> {
    return this.tuitionConfigService.findUnconfiguredMajors(periodId);
  }

  // ==========================================
  // 3. GET - LẤY CHI TIẾT THEO ID
  // ==========================================
  @Get(":id")
  @ApiOperation({ summary: "Lấy chi tiết cấu hình học phí theo ID" })
  @ApiOkResponse({
    description: "Tìm thấy cấu hình học phí.",
    type: TuitionConfigWithItemsDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Không tìm thấy cấu hình học phí với ID cung cấp.",
  })
  async findOne(
    @Param("id", ParseIntPipe) id: number,
  ): Promise<TuitionConfigWithItemsDto> {
    return this.tuitionConfigService.findOne(id);
  }

  // ==========================================
  // 4. PATCH - CẬP NHẬT THEO ID
  // ==========================================
  @Patch(":id")
  @ApiOperation({
    summary: "Cập nhật cấu hình học phí và đồng bộ lại danh sách items",
  })
  @ApiOkResponse({
    description: "Cập nhật cấu hình học phí thành công.",
    type: TuitionConfigWithItemsDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Dữ liệu cập nhật không hợp lệ.",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Không tìm thấy cấu hình học phí cần cập nhật.",
  })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateTuitionConfigDto,
  ): Promise<TuitionConfigWithItemsDto> {
    return this.tuitionConfigService.update(id, updateDto);
  }

  // ==========================================
  // 5. DELETE - XÓA THEO ID
  // ==========================================
  @Delete(":id")
  @ApiOperation({ summary: "Xóa cấu hình học phí theo ID" })
  @ApiOkResponse({
    description: "Xóa thành công cấu hình học phí.",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Xóa thành công Tuition Config có ID 1",
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Không tìm thấy cấu hình học phí cần xóa.",
  })
  async remove(
    @Param("id", ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    return this.tuitionConfigService.remove(id);
  }
}
