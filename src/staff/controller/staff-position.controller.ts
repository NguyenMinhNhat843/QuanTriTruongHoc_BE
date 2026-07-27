import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import {
  CreateStaffPositionDto,
  SearchStaffPositionDto,
  StaffPositionDto,
  StaffPositionWithDetailsDto,
  UpdateStaffPositionDto,
} from "../dto/staff-position.dto";
import { StaffPositionService } from "../service/staff-position.service";

@ApiTags("Staff Positions")
@Controller("staff-positions")
export class StaffPositionController {
  constructor(private readonly staffPositionService: StaffPositionService) {}

  @Post()
  @ApiCreatedResponse({ type: StaffPositionDto })
  create(@Body() dto: CreateStaffPositionDto) {
    return this.staffPositionService.create(dto);
  }

  @Get()
  @ApiOkResponse({ type: [StaffPositionWithDetailsDto] })
  findAll(@Query() query: SearchStaffPositionDto) {
    return this.staffPositionService.findAll(query);
  }

  @Get(":id")
  @ApiOkResponse({ type: StaffPositionDto })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.staffPositionService.findOne(id);
  }

  @Patch(":id")
  @ApiOkResponse({ type: StaffPositionDto })
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateStaffPositionDto) {
    return this.staffPositionService.update(id, dto);
  }

  @Delete(":id")
  @ApiOkResponse({ type: StaffPositionDto })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.staffPositionService.remove(id);
  }
}
