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
import { AdmissionInterestService } from "../services/admission-interest.service.js";
import {
  CreateAdmissionInterestDto,
  SearchAdmissionInterestDto,
  AdmissionInterestDto,
} from "../dtos/admission-interest.dto.js";

@ApiTags("Admission Interests")
@Controller("admission-interests")
export class AdmissionInterestController {
  constructor(
    private readonly admissionInterestService: AdmissionInterestService,
  ) {}

  @Post()
  @ApiOperation({ summary: "Đăng ký nhu cầu tư vấn (Online)" })
  @ApiResponse({ status: 201, type: AdmissionInterestDto })
  create(@Body() dto: CreateAdmissionInterestDto) {
    return this.admissionInterestService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.admin, RoleType.staff)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Danh sách thí sinh đăng ký nhu cầu tư vấn" })
  @ApiResponse({ status: 200 })
  findAll(@Query() query: SearchAdmissionInterestDto) {
    return this.admissionInterestService.findAll(query);
  }

  @Patch(":id/notify")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.admin, RoleType.staff)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Đánh dấu đã thông báo / liên hệ tư vấn" })
  @ApiResponse({ status: 200, type: AdmissionInterestDto })
  markAsNotified(@Param("id", ParseIntPipe) id: number) {
    return this.admissionInterestService.markAsNotified(id);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.admin, RoleType.staff)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Xóa nhu cầu tư vấn" })
  @ApiResponse({ status: 200 })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.admissionInterestService.remove(id);
  }
}

