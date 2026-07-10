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
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import {
  VillageDto,
  CreateVillageDto,
  UpdateVillageDto,
  SearchVillageDto,
} from "../dto/village.dto";
import { VillageService } from "../service/village.service";

@ApiTags("Villages")
@Controller("villages")
export class VillageController {
  constructor(private readonly villageService: VillageService) {}

  @Post()
  @ApiOperation({ summary: "Tạo mới một thôn/xóm/tổ dân phố" })
  @ApiResponse({ status: 201, type: VillageDto })
  create(@Body() createVillageDto: CreateVillageDto) {
    return this.villageService.create(createVillageDto);
  }

  @Get()
  @ApiOperation({
    summary: "Lấy danh sách hoặc lọc thôn/xóm theo wardCode (Mã xã)",
  })
  @ApiResponse({ status: 200, type: [VillageDto] })
  findAll(@Query() query: SearchVillageDto) {
    return this.villageService.findAll(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Lấy chi tiết thông tin thôn/xóm qua ID số" })
  @ApiResponse({ status: 200, type: VillageDto })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.villageService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Cập nhật thông tin thôn/xóm" })
  @ApiResponse({ status: 200, type: VillageDto })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateVillageDto: UpdateVillageDto,
  ) {
    return this.villageService.update(id, updateVillageDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Xóa một thôn/xóm" })
  @ApiResponse({ status: 200, description: "Xóa thành công" })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.villageService.remove(id);
  }
}
