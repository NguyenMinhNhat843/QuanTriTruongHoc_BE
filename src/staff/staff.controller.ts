import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  ParseIntPipe,
  Get,
  Query,
} from "@nestjs/common";
import { StaffService } from "./staff.service.js";
import { CreateStaffDto, SearchStaffDto, UpdateStaffDto } from "./staff.dto.js";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import {
  StaffResponseDto,
  TeacherDashboardStatsResponseDto,
} from "./staff.response.js";
import { Roles } from "../common/decorators/role.decorator.js";
import { RoleType } from "../../prisma/generated/prisma/enums.js";

@ApiTags("Staffs")
@Controller("staffs")
// @UseGuards(JwtAuthGuard, RolesGuard)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  /**
   * Tạo nhân viên (Có thể là teacher hoặc staff bình thường)
   */
  @Post()
  @ApiOperation({ summary: "Tạo nhân viên kèm tài khoản đăng nhập" })
  @Roles(RoleType.admin)
  async create(
    @Body() createStaffDto: CreateStaffDto,
  ): Promise<StaffResponseDto> {
    return this.staffService.createStaff(createStaffDto);
  }

  /**
   * Lấy stat cho trang dashboard của gioa diện teacher
   */
  @Get(":teacherId/dashboardstats")
  @ApiResponse({ status: 200, type: TeacherDashboardStatsResponseDto })
  async getTeacherDashboardStats(
    @Param("teacherId", ParseIntPipe) teacherId: number,
    @Query("semesterId", ParseIntPipe) semesterId?: number,
  ) {
    return this.staffService.getTeacherDasboardStats(teacherId, semesterId);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Cập nhật thông tin nhân viên và tài khoản" })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateStaffDto: UpdateStaffDto,
  ): Promise<StaffResponseDto> {
    return this.staffService.updateStaff(id, updateStaffDto);
  }

  @Get()
  @ApiOperation({ summary: "Tìm kiếm và phân trang danh sách nhân viên" })
  @ApiResponse({ status: 200, type: [StaffResponseDto] })
  async findAll(@Query() query: SearchStaffDto) {
    return this.staffService.searchStaffs(query);
  }

  @Get(":staffCode")
  @ApiOperation({
    summary:
      "Lấy thông tin chi tiết nhân viên kèm thông tin tài khoản (nếu có)",
  })
  @ApiResponse({ status: 200, type: StaffResponseDto })
  async getDetail(@Param("staffCode") staffCode: string) {
    return this.staffService.getDetailStaff(staffCode);
  }
}
