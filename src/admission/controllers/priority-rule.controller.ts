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
import { PriorityRuleService } from "../services/priority-rule.service.js";
import {
  CreatePriorityRuleDto,
  UpdatePriorityRuleDto,
  SearchPriorityRuleDto,
  PriorityRuleDto,
} from "../dtos/priority-rule.dto.js";

@ApiTags("Priority Rules")
@Controller("priority-rules")
export class PriorityRuleController {
  constructor(private readonly priorityRuleService: PriorityRuleService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.admin, RoleType.staff)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Thêm cấu hình quy tắc điểm ưu tiên" })
  @ApiResponse({ status: 201, type: PriorityRuleDto })
  create(@Body() dto: CreatePriorityRuleDto) {
    return this.priorityRuleService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "Danh sách quy tắc điểm ưu tiên" })
  @ApiResponse({ status: 200 })
  findAll(@Query() query: SearchPriorityRuleDto) {
    return this.priorityRuleService.findAll(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Chi tiết quy tắc điểm ưu tiên" })
  @ApiResponse({ status: 200, type: PriorityRuleDto })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.priorityRuleService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.admin, RoleType.staff)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Cập nhật quy tắc điểm ưu tiên" })
  @ApiResponse({ status: 200, type: PriorityRuleDto })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdatePriorityRuleDto,
  ) {
    return this.priorityRuleService.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Xóa quy tắc điểm ưu tiên" })
  @ApiResponse({ status: 200 })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.priorityRuleService.remove(id);
  }
}

