import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { FeeService } from "./fee.service";
import { CreateFeeDto, UpdateFeeDto } from "./fee.dto";

@ApiTags("Fees (Danh mục phí)") // Gom nhóm trên Swagger UI
@Controller("fees")
export class FeeController {
  constructor(private readonly feeService: FeeService) {}

  @Post()
  @ApiOperation({ summary: "Tạo mới một danh mục phí" })
  @ApiResponse({ status: 201, description: "Tạo thành công." })
  @ApiResponse({ status: 400, description: "Dữ liệu đầu vào không hợp lệ." })
  create(@Body() createFeeDto: CreateFeeDto) {
    return this.feeService.create(createFeeDto);
  }

  @Get()
  @ApiOperation({ summary: "Lấy danh sách tất cả các loại phí" })
  findAll() {
    return this.feeService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Lấy chi tiết một loại phí theo ID" })
  findOne(@Param("id") id: string) {
    return this.feeService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Cập nhật thông tin loại phí" })
  update(@Param("id") id: string, @Body() updateFeeDto: UpdateFeeDto) {
    return this.feeService.update(id, updateFeeDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Xóa một loại phí" })
  remove(@Param("id") id: string) {
    return this.feeService.remove(id);
  }
}
