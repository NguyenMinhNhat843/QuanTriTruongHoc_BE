import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guard/jwt-auth.guard.js";
import { RolesGuard } from "../../auth/guard/role.guard.js";
import { Roles } from "../../common/decorators/role.decorator.js";
import { RoleType } from "../../../prisma/generated/prisma/client.js";
import { AdmissionCampaignService } from "../services/admission-campaign.service.js";
import {
  CreateAdmissionCampaignDto,
  UpdateAdmissionCampaignDto,
  SearchAdmissionCampaignDto,
  AdmissionCampaignDto,
  ResponseAdmissionCampaignPaginationDto,
  AdmissionCampaignDetailDto,
  FindActiveCampaignDto,
} from "../dtos/admission-campaign.dto.js";

@ApiTags("Admission Campaigns")
@Controller("admission-campaigns")
export class AdmissionCampaignController {
  constructor(private readonly admissionCampaignService: AdmissionCampaignService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.admin, RoleType.staff)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Tạo đợt tuyển sinh mới" })
  @ApiResponse({ status: 201 })
  create(@Body() dto: CreateAdmissionCampaignDto) {
    return this.admissionCampaignService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "Danh sách đợt tuyển sinh" })
  @ApiResponse({ status: 200, type: ResponseAdmissionCampaignPaginationDto })
  findAll(@Query() query: SearchAdmissionCampaignDto) {
    return this.admissionCampaignService.findAll(query);
  }

  @Get("active")
  @ApiOperation({ summary: "Danh sách đợt tuyển sinh đang mở theo năm học active" })
  @ApiResponse({ status: 200, type: [AdmissionCampaignDetailDto] })
  findActive(@Query() query: FindActiveCampaignDto) {
    return this.admissionCampaignService.findActiveCampaigns(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Chi tiết đợt tuyển sinh" })
  @ApiResponse({ status: 200, type: AdmissionCampaignDetailDto })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.admissionCampaignService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.admin, RoleType.staff)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Cập nhật đợt tuyển sinh" })
  @ApiResponse({ status: 200, type: AdmissionCampaignDto })
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateAdmissionCampaignDto) {
    return this.admissionCampaignService.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Xóa đợt tuyển sinh" })
  @ApiResponse({ status: 200 })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.admissionCampaignService.remove(id);
  }
}
