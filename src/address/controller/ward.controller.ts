import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import {
  WardDto,
  CreateWardDto,
  UpdateWardDto,
  SearchWardDto,
} from "../dto/ward.dto";
import { WardService } from "../service/ward.service";

@ApiTags("Wards")
@Controller("wards")
export class WardController {
  constructor(private readonly wardService: WardService) {}

  @Post()
  @ApiOperation({ summary: "Tạo mới một xã/phường" })
  @ApiResponse({ status: 201, type: WardDto })
  create(@Body() createWardDto: CreateWardDto) {
    return this.wardService.create(createWardDto);
  }

  @Get()
  @ApiOperation({
    summary:
      "Lấy danh sách hoặc tìm kiếm xã/phường (ví dụ: lọc theo provinceCode)",
  })
  @ApiResponse({ status: 200, type: [WardDto] })
  findAll(@Query() query: SearchWardDto) {
    return this.wardService.findAll(query);
  }

  @Get(":code")
  @ApiOperation({ summary: "Lấy chi tiết xã/phường bằng mã code" })
  @ApiResponse({ status: 200, type: WardDto })
  findOne(@Param("code") code: string) {
    return this.wardService.findOne(code);
  }

  @Patch(":code")
  @ApiOperation({ summary: "Cập nhật thông tin xã/phường" })
  @ApiResponse({ status: 200, type: WardDto })
  update(@Param("code") code: string, @Body() updateWardDto: UpdateWardDto) {
    return this.wardService.update(code, updateWardDto);
  }

  @Delete(":code")
  @ApiOperation({ summary: "Xóa một xã/phường" })
  @ApiResponse({ status: 200, description: "Xóa thành công" })
  remove(@Param("code") code: string) {
    return this.wardService.remove(code);
  }
}
