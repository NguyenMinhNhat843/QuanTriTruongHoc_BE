import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  ParseIntPipe,
  Get,
  Query,
  UseGuards,
} from "@nestjs/common";
import { StaffService } from "./staff.service.js";
import { CreateStaffDto, SearchStaffDto, UpdateStaffDto } from "./staff.dto.js";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { StaffResponseDto } from "./staff.response.js";
import { JwtAuthGuard } from "../auth/guard/jwt-auth.guard.js";
import { GetUser } from "../common/decorators/get-user.decorator.js";
import { RolesGuard } from "../auth/guard/role.guard.js";
import { Roles } from "../common/decorators/role.decorator.js";
import { RoleType } from "../../prisma/generated/prisma/enums.js";

@ApiTags("Staffs")
@Controller("staffs")
@UseGuards(JwtAuthGuard, RolesGuard)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @ApiOperation({ summary: "Tạo nhân viên kèm tài khoản đăng nhập" })
  @Roles(RoleType.admin)
  async create(
    @Body() createStaffDto: CreateStaffDto,
    @GetUser() user: any, // Lấy thông tin người đang thực hiện tạo
  ): Promise<StaffResponseDto> {
    console.log("Admin thực hiện:", user.username);
    return this.staffService.createStaff(createStaffDto);
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
  async findAll(@Query() query: SearchStaffDto) {
    return this.staffService.searchStaffs(query);
  }
}
