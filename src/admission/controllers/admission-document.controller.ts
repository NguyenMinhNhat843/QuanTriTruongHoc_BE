import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guard/jwt-auth.guard.js";
import { RolesGuard } from "../../auth/guard/role.guard.js";
import { Roles } from "../../common/decorators/role.decorator.js";
import { GetUser } from "../../common/decorators/get-user.decorator.js";
import { RoleType } from "../../../prisma/generated/prisma/client.js";
import { AdmissionDocumentService } from "../services/admission-document.service.js";
import {
  CreateAdmissionDocumentDto,
  VerifyAdmissionDocumentDto,
  AdmissionDocumentDto,
} from "../dtos/admission-document.dto.js";

@ApiTags("Admission Documents")
@Controller("admission-documents")
export class AdmissionDocumentController {
  constructor(private readonly admissionDocumentService: AdmissionDocumentService) {}

  @Post()
  @ApiOperation({ summary: "Tải lên tài liệu số hóa cho hồ sơ" })
  @ApiResponse({ status: 201, type: AdmissionDocumentDto })
  uploadDocument(@Body() dto: CreateAdmissionDocumentDto) {
    return this.admissionDocumentService.uploadDocument(dto);
  }

  @Get("profile/:profileId")
  @ApiOperation({ summary: "Danh sách tài liệu của một hồ sơ" })
  @ApiResponse({ status: 200, type: [AdmissionDocumentDto] })
  findByProfile(@Param("profileId", ParseIntPipe) profileId: number) {
    return this.admissionDocumentService.findByProfile(profileId);
  }

  @Patch(":id/verify")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.admin, RoleType.staff)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Duyệt hoặc từ chối tài liệu số hóa" })
  @ApiResponse({ status: 200, type: AdmissionDocumentDto })
  verifyDocument(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: VerifyAdmissionDocumentDto,
    @GetUser() user: any,
  ) {
    return this.admissionDocumentService.verifyDocument(id, dto, user?.id);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.admin, RoleType.staff)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Xóa tài liệu" })
  @ApiResponse({ status: 200 })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.admissionDocumentService.remove(id);
  }
}

