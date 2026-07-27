import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import {
  CreateManagementPositionDto,
  ManagementPositionDto,
  SearchManagementPositionDto,
  UpdateManagementPositionDto,
} from "../dto/management-position.dto";
import { ManagementPositionService } from "../service/manager-position.service";

@ApiTags("Management Positions")
@Controller("management-positions")
export class ManagementPositionController {
  constructor(private readonly managementPositionService: ManagementPositionService) {}

  @Post()
  @ApiCreatedResponse({ type: ManagementPositionDto })
  create(@Body() dto: CreateManagementPositionDto) {
    return this.managementPositionService.create(dto);
  }

  @Get()
  @ApiOkResponse({ type: [ManagementPositionDto] })
  getData(@Query() query: SearchManagementPositionDto) {
    return this.managementPositionService.getData(query);
  }

  @Get(":id")
  @ApiOkResponse({ type: ManagementPositionDto })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.managementPositionService.findOne(id);
  }

  @Patch(":id")
  @ApiOkResponse({ type: ManagementPositionDto })
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateManagementPositionDto) {
    return this.managementPositionService.update(id, dto);
  }

  @Delete(":id")
  @ApiOkResponse({ type: ManagementPositionDto })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.managementPositionService.remove(id);
  }
}
