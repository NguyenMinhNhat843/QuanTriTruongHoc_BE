import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseIntPipe,
  Delete,
  Query,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiOkResponse,
} from "@nestjs/swagger";
import { BatchService } from "./batch.service";
import { CreateBatchDto, SearchBatchDto, UpdateBatchDto } from "./batch.dto";
import { BatchResponseDto } from "./batch.response";

@ApiTags("Batches (Khóa đào tạo)") // Phân nhóm trong Swagger
@Controller("batches")
export class BatchController {
  constructor(private readonly batchService: BatchService) {}

  @Post()
  @ApiOperation({ summary: "Tạo mới một khóa đào tạo" })
  @ApiResponse({ status: 201, description: "Tạo thành công." })
  @ApiResponse({ status: 409, description: "Mã khóa học đã tồn tại." })
  create(@Body() createBatchDto: CreateBatchDto) {
    return this.batchService.create(createBatchDto);
  }

  @Get()
  @ApiOperation({ summary: "Lấy danh sách tất cả các khóa đào tạo" })
  @ApiOkResponse({ type: [BatchResponseDto] })
  findAll(@Query() query: SearchBatchDto) {
    return this.batchService.findAll(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Lấy thông tin chi tiết một khóa đào tạo" })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.batchService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Cập nhật thông tin khóa đào tạo" })
  @ApiResponse({ status: 200, description: "Cập nhật thành công." })
  @ApiResponse({ status: 404, description: "Không tìm thấy khóa." })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateBatchDto: UpdateBatchDto,
  ) {
    return this.batchService.update(id, updateBatchDto);
  }

  // delete by id
  @Delete(":id")
  @ApiOperation({ summary: "Xóa một khóa đào tạo theo ID" })
  @ApiResponse({ status: 200, description: "Xóa thành công." })
  @ApiResponse({ status: 404, description: "Không tìm thấy khóa." })
  async deleteBatchById(@Param("id", ParseIntPipe) id: number) {
    return await this.batchService.deleteBatchById(id);
  }
}
