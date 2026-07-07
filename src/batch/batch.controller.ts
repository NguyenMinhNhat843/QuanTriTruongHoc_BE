import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseIntPipe,
  Delete,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { BatchService } from "./batch.service";
import { CreateBatchDto, SearchBatchDto, UpdateBatchDto } from "./batch.dto";
import { BatchResponseDto } from "./batch.response";
import { JwtAuthGuard } from "../auth/guard/jwt-auth.guard";
import { RolesGuard } from "../auth/guard/role.guard";
import { Roles } from "../common/decorators/role.decorator";
import { RoleType } from "../../prisma/generated/prisma/enums";

@ApiTags("Batches (Khóa đào tạo)")
@Controller("batches")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.admin)
export class BatchController {
  constructor(private readonly batchService: BatchService) {}

  @Post()
  @ApiOperation({ summary: "Tạo mới một khóa đào tạo" })
  create(@Body() createBatchDto: CreateBatchDto) {
    return this.batchService.create(createBatchDto);
  }

  @Get()
  @ApiOperation({ summary: "Lấy danh sách tất cả các khóa đào tạo" })
  @ApiOkResponse({ type: [BatchResponseDto] })
  findAll(@Query() query: SearchBatchDto) {
    return this.batchService.findAll(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Lấy thông tin chi tiết một khóa đào tạo" })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.batchService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Cập nhật thông tin khóa đào tạo" })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateBatchDto: UpdateBatchDto,
  ) {
    return this.batchService.update(id, updateBatchDto);
  }

  // delete by id
  @Delete(":id")
  @ApiOperation({ summary: "Xóa một khóa đào tạo theo ID" })
  async deleteBatchById(@Param("id", ParseIntPipe) id: number) {
    return await this.batchService.deleteBatchById(id);
  }
}
