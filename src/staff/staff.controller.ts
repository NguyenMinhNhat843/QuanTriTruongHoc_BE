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
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { StaffResponseDto } from "./staff.response.js";

@ApiTags("Staffs")
@Controller("staffs")
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @ApiOperation({ summary: "Tạo nhân viên kèm tài khoản đăng nhập" })
  async create(
    @Body() createStaffDto: CreateStaffDto,
  ): Promise<StaffResponseDto> {
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
