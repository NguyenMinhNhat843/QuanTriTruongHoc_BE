import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import {
  CreateAdmissionCampaignDto,
  UpdateAdmissionCampaignDto,
  SearchAdmissionCampaignDto,
  AdmissionCampaignDto,
  ResponseAdmissionCampaignPaginationPaginationDto,
} from "../dto/admission-campaign.dto";
import { AdmissionCampaignService } from "../service/admission-campaign.service";

@ApiTags("Admission Campaigns: Đợt tuyển sinh")
@Controller("admission-campaigns")
export class AdmissionCampaignController {
  constructor(private readonly admissionCampaignService: AdmissionCampaignService) {}

  @Post()
  @ApiOperation({ summary: "Tạo mới Admission Campaign" })
  @ApiResponse({ status: 201, type: AdmissionCampaignDto })
  create(@Body() createDto: CreateAdmissionCampaignDto) {
    return this.admissionCampaignService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: "Lấy danh sách Admission Campaigns" })
  @ApiResponse({ status: 200, type: ResponseAdmissionCampaignPaginationPaginationDto })
  findAll(@Query() query: SearchAdmissionCampaignDto) {
    return this.admissionCampaignService.findAll(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Lấy chi tiết Admission Campaign" })
  @ApiResponse({ status: 200, type: AdmissionCampaignDto })
  @ApiResponse({ status: 404 })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.admissionCampaignService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Cập nhật Admission Campaign" })
  @ApiResponse({ status: 200, type: AdmissionCampaignDto })
  @ApiResponse({ status: 404 })
  update(@Param("id", ParseIntPipe) id: number, @Body() updateDto: UpdateAdmissionCampaignDto) {
    return this.admissionCampaignService.update(id, updateDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Xóa Admission Campaign" })
  @ApiResponse({ status: 200, type: AdmissionCampaignDto })
  @ApiResponse({ status: 404 })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.admissionCampaignService.remove(id);
  }
}
