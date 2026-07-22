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
import { AdmissionCampaignMajorService } from "../services/admission-campaign-major.service.js";
import {
  CreateAdmissionCampaignMajorDto,
  UpdateAdmissionCampaignMajorDto,
  SearchAdmissionCampaignMajorDto,
  AdmissionCampaignMajorDto,
} from "../dtos/admission-campaign-major.dto.js";

@ApiTags("Admission Campaign Majors")
@Controller("admission-campaign-majors")
export class AdmissionCampaignMajorController {
  constructor(
    private readonly admissionCampaignMajorService: AdmissionCampaignMajorService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.admin, RoleType.staff)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Thêm ngành và chỉ tiêu cho đợt tuyển sinh" })
  @ApiResponse({ status: 201, type: AdmissionCampaignMajorDto })
  create(@Body() dto: CreateAdmissionCampaignMajorDto) {
    return this.admissionCampaignMajorService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "Danh sách chỉ tiêu ngành theo đợt tuyển sinh" })
  @ApiResponse({ status: 200 })
  findAll(@Query() query: SearchAdmissionCampaignMajorDto) {
    return this.admissionCampaignMajorService.findAll(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Chi tiết chỉ tiêu ngành" })
  @ApiResponse({ status: 200, type: AdmissionCampaignMajorDto })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.admissionCampaignMajorService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.admin, RoleType.staff)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Cập nhật chỉ tiêu ngành" })
  @ApiResponse({ status: 200, type: AdmissionCampaignMajorDto })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateAdmissionCampaignMajorDto,
  ) {
    return this.admissionCampaignMajorService.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Xóa ngành khỏi đợt tuyển sinh" })
  @ApiResponse({ status: 200 })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.admissionCampaignMajorService.remove(id);
  }
}

