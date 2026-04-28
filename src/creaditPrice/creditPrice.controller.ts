import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseIntPipe,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { CreditPriceService } from "./creditPrice.service";
import { CreateCreditPriceDto, UpdateCreditPriceDto } from "./creditPrice.dto";

@ApiTags("Credit Price") // Phân nhóm trong Swagger UI
@Controller("credit-prices")
export class CreditPriceController {
  constructor(private readonly creditPriceService: CreditPriceService) {}

  @Post()
  @ApiOperation({ summary: "Tạo mới thiết lập giá tín chỉ" })
  @ApiResponse({ status: 201, description: "Tạo thành công." })
  @ApiResponse({ status: 400, description: "Dữ liệu đầu vào không hợp lệ." })
  create(@Body() createCreditPriceDto: CreateCreditPriceDto) {
    return this.creditPriceService.create(createCreditPriceDto);
  }

  @Get()
  @ApiOperation({ summary: "Lấy danh sách tất cả các thiết lập giá tín chỉ" })
  @ApiResponse({ status: 200, description: "Trả về danh sách thành công." })
  findAll() {
    return this.creditPriceService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Lấy chi tiết một thiết lập giá theo ID" })
  @ApiResponse({ status: 200, description: "Thành công." })
  @ApiResponse({ status: 404, description: "Không tìm thấy ID." })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.creditPriceService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Cập nhật thiết lập giá tín chỉ" })
  @ApiResponse({ status: 200, description: "Cập nhật thành công." })
  @ApiResponse({ status: 404, description: "Không tìm thấy ID." })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateCreditPriceDto: UpdateCreditPriceDto,
  ) {
    return this.creditPriceService.update(id, updateCreditPriceDto);
  }
}
