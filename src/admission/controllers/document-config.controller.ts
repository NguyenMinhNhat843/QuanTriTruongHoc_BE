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
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guard/jwt-auth.guard.js";
import { RolesGuard } from "../../auth/guard/role.guard.js";
import { Roles } from "../../common/decorators/role.decorator.js";
import { RoleType } from "../../../prisma/generated/prisma/client.js";
import { DocumentConfigService } from "../services/document-config.service.js";
import {
  CreateDocumentConfigDto,
  UpdateDocumentConfigDto,
  SearchDocumentConfigDto,
  DocumentConfigDto,
} from "../dtos/document-config.dto.js";

@ApiTags("Document Configs")
@Controller("document-configs")
export class DocumentConfigController {
  constructor(private readonly documentConfigService: DocumentConfigService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.admin, RoleType.staff)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Tạo cấu hình checklist tài liệu" })
  @ApiResponse({ status: 201, type: DocumentConfigDto })
  create(@Body() dto: CreateDocumentConfigDto) {
    return this.documentConfigService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "Danh sách cấu hình checklist tài liệu" })
  @ApiResponse({ status: 200 })
  findAll(@Query() query: SearchDocumentConfigDto) {
    return this.documentConfigService.findAll(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Chi tiết cấu hình checklist tài liệu" })
  @ApiResponse({ status: 200, type: DocumentConfigDto })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.documentConfigService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.admin, RoleType.staff)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Cập nhật cấu hình checklist" })
  @ApiResponse({ status: 200, type: DocumentConfigDto })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateDocumentConfigDto,
  ) {
    return this.documentConfigService.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Xóa cấu hình checklist" })
  @ApiResponse({ status: 200 })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.documentConfigService.remove(id);
  }
}

