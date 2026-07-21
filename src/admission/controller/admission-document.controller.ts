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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from "@nestjs/swagger";
import {
  CreateAdmissionDocumentDto,
  UpdateAdmissionDocumentDto,
  SearchAdmissionDocumentDto,
  AdmissionDocumentDto,
} from "../dto/admission-document.dto";
import { DocumentStatus } from "../../../prisma/generated/prisma/client";
import { AdmissionDocumentService } from "../service/admission-document.service";

@ApiTags("Admission Documents")
@Controller("admission-documents")
export class AdmissionDocumentController {
  constructor(private readonly admissionDocumentService: AdmissionDocumentService) {}

  @Post()
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Tải lên tài liệu minh chứng tuyển sinh" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        admissionProfileId: { type: "number" },
        documentConfigItemId: { type: "number" },
        file: { type: "string", format: "binary" },
      },
      required: ["admissionProfileId", "documentConfigItemId", "file"],
    },
  })
  @ApiResponse({ status: 201, type: AdmissionDocumentDto })
  create(@Body() createDto: CreateAdmissionDocumentDto, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("Vui lòng tải lên file minh chứng");
    }
    return this.admissionDocumentService.createWithFile(createDto, file);
  }

  @Get()
  @ApiOperation({ summary: "Lấy danh sách tài liệu minh chứng" })
  @ApiResponse({ status: 200, type: [AdmissionDocumentDto] })
  findAll(@Query() query: SearchAdmissionDocumentDto) {
    return this.admissionDocumentService.findAll(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Lấy chi tiết tài liệu minh chứng" })
  @ApiResponse({ status: 200, type: AdmissionDocumentDto })
  @ApiResponse({ status: 404 })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.admissionDocumentService.findOne(id);
  }

  @Patch(":id")
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Cập nhật tài liệu minh chứng (có thể tải đè file mới)" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        admissionProfileId: { type: "number" },
        documentConfigItemId: { type: "number" },
        file: { type: "string", format: "binary" },
      },
    },
  })
  @ApiResponse({ status: 200, type: AdmissionDocumentDto })
  @ApiResponse({ status: 404 })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateAdmissionDocumentDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.admissionDocumentService.update(id, updateDto, file);
  }

  @Patch(":id/verify")
  @ApiOperation({ summary: "Cán bộ xét duyệt hoặc từ chối tài liệu minh chứng" })
  @ApiResponse({ status: 200, type: AdmissionDocumentDto })
  @ApiResponse({ status: 404 })
  verifyDocument(
    @Param("id", ParseIntPipe) id: number,
    @Body("status") status: DocumentStatus,
    @Body("verifiedByUserId", ParseIntPipe) verifiedByUserId: number,
    @Body("rejectionReason") rejectionReason?: string,
  ) {
    return this.admissionDocumentService.verifyDocument(id, status, verifiedByUserId, rejectionReason);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Xóa tài liệu minh chứng" })
  @ApiResponse({ status: 200, type: AdmissionDocumentDto })
  @ApiResponse({ status: 404 })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.admissionDocumentService.remove(id);
  }
}
