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
  CreateDocumentConfigItemDto,
  DocumentConfigItemResponseDto,
} from "./docConfigItem.dto";
import { DocumentConfigItemService } from "./docConfigItem.service";

@ApiTags("Document Config Item")
@Controller("document-config-items")
export class DocumentConfigItemController {
  constructor(
    private readonly documentConfigItemService: DocumentConfigItemService,
  ) {}

  @Post()
  @ApiOperation({ summary: "Tạo mới cấu hình mục tài liệu" })
  @ApiResponse({ status: 201, type: DocumentConfigItemResponseDto })
  async create(
    @Body() dto: CreateDocumentConfigItemDto,
  ): Promise<DocumentConfigItemResponseDto> {
    return this.documentConfigItemService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "Lấy danh sách tất cả cấu hình mục tài liệu" })
  @ApiResponse({ status: 200, type: [DocumentConfigItemResponseDto] })
  async findAll(): Promise<DocumentConfigItemResponseDto[]> {
    return this.documentConfigItemService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Lấy chi tiết cấu hình mục tài liệu theo ID" })
  @ApiResponse({ status: 200, type: DocumentConfigItemResponseDto })
  @ApiResponse({ status: 404 })
  async findOne(
    @Param("id", ParseIntPipe) id: number,
  ): Promise<DocumentConfigItemResponseDto> {
    return this.documentConfigItemService.findOne(id);
  }
}
