import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import {
  CreateTeachingLevelDto,
  SearchTeachingLevelDto,
  TeachingLevelDto,
  TeachingLevelPaginationResponseDto,
  UpdateTeachingLevelDto,
} from "../dto/teaching-level.dto";
import { TeachingLevelService } from "../service/teaching-level.service";

@ApiTags("Teaching Levels")
@Controller("teaching-levels")
export class TeachingLevelController {
  constructor(private readonly teachingLevelService: TeachingLevelService) {}

  @Post()
  @ApiCreatedResponse({ type: TeachingLevelDto })
  create(@Body() dto: CreateTeachingLevelDto) {
    return this.teachingLevelService.create(dto);
  }

  @Get()
  @ApiOkResponse({ type: TeachingLevelPaginationResponseDto })
  findAll(@Query() query: SearchTeachingLevelDto) {
    return this.teachingLevelService.findAll(query);
  }

  @Get(":id")
  @ApiOkResponse({ type: TeachingLevelDto })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.teachingLevelService.findOne(id);
  }

  @Patch(":id")
  @ApiOkResponse({ type: TeachingLevelDto })
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateTeachingLevelDto) {
    return this.teachingLevelService.update(id, dto);
  }

  @Delete(":id")
  @ApiOkResponse({ type: TeachingLevelDto })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.teachingLevelService.remove(id);
  }
}
