import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import {
  CreateDocumentConfigDto,
  UpdateDocumentConfigDto,
  SearchDocumentConfigDto,
  DocumentConfigDto,
  ResponseDocumentConfigPaginationDto,
} from "../dto/document-config.dto";
import { DocumentConfigService } from "../service/document-config.service";

@ApiTags("Document Configs")
@Controller("document-configs")
export class DocumentConfigController {
  constructor(private readonly documentConfigService: DocumentConfigService) {}

  @Post()
  @ApiOperation({ summary: "Tạo mới Document Config" })
  @ApiResponse({ status: 201, type: DocumentConfigDto })
  create(@Body() createDto: CreateDocumentConfigDto) {
    return this.documentConfigService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: "Lấy danh sách Document Configs" })
  @ApiResponse({ status: 200, type: ResponseDocumentConfigPaginationDto })
  findAll(@Query() query: SearchDocumentConfigDto) {
    return this.documentConfigService.findAll(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Lấy chi tiết Document Config" })
  @ApiResponse({ status: 200, type: DocumentConfigDto })
  @ApiResponse({ status: 404 })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.documentConfigService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Cập nhật Document Config" })
  @ApiResponse({ status: 200, type: DocumentConfigDto })
  @ApiResponse({ status: 404 })
  update(@Param("id", ParseIntPipe) id: number, @Body() updateDto: UpdateDocumentConfigDto) {
    return this.documentConfigService.update(id, updateDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Xóa Document Config" })
  @ApiResponse({ status: 200, type: DocumentConfigDto })
  @ApiResponse({ status: 404 })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.documentConfigService.remove(id);
  }
}
