import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
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
