import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guard/jwt-auth.guard.js";
import { RolesGuard } from "../../auth/guard/role.guard.js";
import { Roles } from "../../common/decorators/role.decorator.js";
import { RoleType } from "../../../prisma/generated/prisma/client.js";
import { SubjectCombinationService } from "../services/subject-combination.service.js";
import {
  CreateSubjectCombinationDto,
  UpdateSubjectCombinationDto,
  SearchSubjectCombinationDto,
  SubjectCombinationDto,
  SubjectCombinationPaginationDto,
} from "../dtos/subject-combination.dto.js";

@ApiTags("Subject Combinations")
@Controller("subject-combinations")
export class SubjectCombinationController {
  constructor(private readonly subjectCombinationService: SubjectCombinationService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.admin, RoleType.staff)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Tạo tổ hợp môn xét tuyển" })
  @ApiResponse({ status: 201, type: SubjectCombinationDto })
  create(@Body() dto: CreateSubjectCombinationDto) {
    return this.subjectCombinationService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "Danh sách tổ hợp môn xét tuyển" })
  @ApiResponse({ status: 200, type: SubjectCombinationPaginationDto })
  findAll(@Query() query: SearchSubjectCombinationDto) {
    return this.subjectCombinationService.findAll(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Chi tiết tổ hợp môn" })
  @ApiResponse({ status: 200, type: SubjectCombinationDto })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.subjectCombinationService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.admin, RoleType.staff)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Cập nhật tổ hợp môn" })
  @ApiResponse({ status: 200, type: SubjectCombinationDto })
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateSubjectCombinationDto) {
    return this.subjectCombinationService.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Xóa tổ hợp môn" })
  @ApiResponse({ status: 200 })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.subjectCombinationService.remove(id);
  }
}
