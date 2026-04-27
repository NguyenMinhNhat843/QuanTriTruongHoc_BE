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
import { FeeCatalogService } from "./feeCatalog.service";
import { CreateFeeCatalogDto, UpdateFeeCatalogDto } from "./feeCatalog.dto";

@ApiTags("Fee Catalogs (Cấu hình chi tiết phí)")
@Controller("fee-catalogs")
export class FeeCatalogController {
  constructor(private readonly feeCatalogService: FeeCatalogService) {}

  @Post()
  @ApiOperation({ summary: "Tạo mới cấu hình phí cho đối tượng cụ thể" })
  @ApiResponse({ status: 201, description: "Tạo cấu hình thành công." })
  @ApiResponse({ status: 404, description: "Không tìm thấy Fee ID tương ứng." })
  create(@Body() createFeeCatalogDto: CreateFeeCatalogDto) {
    return this.feeCatalogService.create(createFeeCatalogDto);
  }

  @Get()
  @ApiOperation({ summary: "Lấy toàn bộ danh sách cấu hình phí" })
  findAll() {
    return this.feeCatalogService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Lấy chi tiết một cấu hình phí" })
  findOne(@Param("id") id: number) {
    return this.feeCatalogService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Cập nhật cấu hình phí" })
  update(
    @Param("id") id: number,
    @Body() updateFeeCatalogDto: UpdateFeeCatalogDto,
  ) {
    return this.feeCatalogService.update(id, updateFeeCatalogDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Xóa một cấu hình phí" })
  remove(@Param("id") id: number) {
    return this.feeCatalogService.remove(id);
  }
}
