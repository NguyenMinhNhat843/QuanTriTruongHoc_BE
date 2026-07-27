import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import {
  CreateTeachingQuotaDto,
  SearchTeachingQuotaDto,
  TeachingQuotaDto,
  TeachingQuotaPaginationResponseDto,
  UpdateTeachingQuotaDto,
} from "../dto/teaching-quota.dto";
import { TeachingQuotaService } from "../service/teaching-quota.service";

@ApiTags("Teaching Quotas")
@Controller("teaching-quotas")
export class TeachingQuotaController {
  constructor(private readonly teachingQuotaService: TeachingQuotaService) {}

  @Post()
  @ApiCreatedResponse({ type: TeachingQuotaDto })
  create(@Body() dto: CreateTeachingQuotaDto) {
    return this.teachingQuotaService.create(dto);
  }

  @Post("sync-actual-hours/academic-year/:academicYearId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Đồng bộ giờ dạy thực tế của tất cả giảng viên theo năm học" })
  @ApiParam({ name: "academicYearId", type: Number, description: "ID của năm học" })
  @ApiResponse({
    status: 200,
    description: "Kết quả đồng bộ danh sách giảng viên",
    schema: {
      example: [
        { staffId: 1, status: "SUCCESS", actualHours: 45 },
        { staffId: 2, status: "FAILED", reason: "Không tìm thấy dữ liệu phân công" },
      ],
    },
  })
  async syncAllTeachersActualHours(@Param("academicYearId", ParseIntPipe) academicYearId: number) {
    return this.teachingQuotaService.syncAllTeachersActualHours(academicYearId);
  }

  @Get()
  @ApiOkResponse({ type: TeachingQuotaPaginationResponseDto })
  findAll(@Query() query: SearchTeachingQuotaDto) {
    return this.teachingQuotaService.findAll(query);
  }

  @Get(":id")
  @ApiOkResponse({ type: TeachingQuotaDto })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.teachingQuotaService.findOne(id);
  }

  @Patch(":id")
  @ApiOkResponse({ type: TeachingQuotaDto })
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateTeachingQuotaDto) {
    return this.teachingQuotaService.update(id, dto);
  }

  @Delete(":id")
  @ApiOkResponse({ type: TeachingQuotaDto })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.teachingQuotaService.remove(id);
  }
}
