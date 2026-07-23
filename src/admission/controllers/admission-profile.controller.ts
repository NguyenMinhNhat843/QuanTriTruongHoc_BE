import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guard/jwt-auth.guard.js";
import { RolesGuard } from "../../auth/guard/role.guard.js";
import { Roles } from "../../common/decorators/role.decorator.js";
import { GetUser } from "../../common/decorators/get-user.decorator.js";
import { RoleType } from "../../../prisma/generated/prisma/client.js";
import { AdmissionProfileService } from "../services/admission-profile.service.js";
import {
  CreateAdmissionProfileDto,
  UpdateAdmissionProfileDto,
  SearchAdmissionProfileDto,
  ChangeProfileStatusDto,
  AdmissionProfileDto,
  ResponseAdmissionProfilePaginationDto,
  AdmissionProfileDetailDto,
} from "../dtos/admission-profile.dto.js";

@ApiTags("Admission Profiles")
@Controller("admission-profiles")
export class AdmissionProfileController {
  constructor(private readonly admissionProfileService: AdmissionProfileService) {}

  @Post()
  @ApiOperation({ summary: "Đăng ký hồ sơ xét tuyển (Online hoặc Staff nhập)" })
  @ApiResponse({ status: 201, type: AdmissionProfileDto })
  create(@Body() dto: CreateAdmissionProfileDto) {
    return this.admissionProfileService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.admin, RoleType.staff)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Danh sách hồ sơ đăng ký xét tuyển" })
  @ApiResponse({ status: 200, type: ResponseAdmissionProfilePaginationDto })
  findAll(@Query() query: SearchAdmissionProfileDto) {
    return this.admissionProfileService.findAll(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Chi tiết hồ sơ xét tuyển" })
  @ApiResponse({ status: 200, type: AdmissionProfileDetailDto })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.admissionProfileService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.admin, RoleType.staff)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Cập nhật hồ sơ xét tuyển" })
  @ApiResponse({ status: 200, type: AdmissionProfileDto })
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateAdmissionProfileDto) {
    return this.admissionProfileService.update(id, dto);
  }

  @Patch(":id/status")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.admin, RoleType.staff)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Duyệt / Chuyển trạng thái hồ sơ (Ví dụ: ENROLLED)" })
  @ApiResponse({ status: 200, type: AdmissionProfileDto })
  changeStatus(@Param("id", ParseIntPipe) id: number, @Body() dto: ChangeProfileStatusDto, @GetUser() user: any) {
    return this.admissionProfileService.changeStatus(id, dto, user?.id);
  }

  @Post(":id/recalculate-score")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.admin, RoleType.staff)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Tính toán lại điểm xét tuyển" })
  @ApiResponse({ status: 200 })
  async recalculateScore(@Param("id", ParseIntPipe) id: number) {
    await this.admissionProfileService.recalculateScore(id);
    return this.admissionProfileService.findOne(id);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Xóa hồ sơ xét tuyển" })
  @ApiResponse({ status: 200 })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.admissionProfileService.remove(id);
  }
}
