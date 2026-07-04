import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import {
  CreateDocumentConfigDto,
  DocumentConfigResponseDto,
  DocumentConfigWithItemsResponseDto,
} from "../dto/docConfig.dto";
import { DocumentConfigService } from "../service/docConfig.service";

@ApiTags("Document Config")
@Controller("document-configs")
export class DocumentConfigController {
  constructor(private readonly documentConfigService: DocumentConfigService) {}

  @Post()
  @ApiOperation({ summary: "Tạo mới cấu hình tài liệu" })
  async create(@Body() dto: CreateDocumentConfigDto) {
    return this.documentConfigService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "Lấy danh sách tất cả cấu hình tài liệu" })
  @ApiResponse({ status: 200, type: [DocumentConfigResponseDto] })
  async findAll(): Promise<DocumentConfigResponseDto[]> {
    return this.documentConfigService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Lấy chi tiết cấu hình tài liệu theo ID" })
  @ApiResponse({ status: 200, type: DocumentConfigWithItemsResponseDto })
  @ApiResponse({ status: 404 })
  async findOne(
    @Param("id", ParseIntPipe) id: number,
  ): Promise<DocumentConfigWithItemsResponseDto> {
    return this.documentConfigService.findOne(id);
  }
}
