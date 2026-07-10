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
  ProvinceDto,
  CreateProvinceDto,
  UpdateProvinceDto,
  SearchProvinceDto,
} from "../dto/province.dto";
import { ProvinceService } from "../service/province.service";

@ApiTags("Provinces") // Nhóm nhóm API này trên Swagger UI
@Controller("provinces")
export class ProvinceController {
  constructor(private readonly provinceService: ProvinceService) {}

  @Post()
  @ApiOperation({ summary: "Tạo mới một tỉnh/thành phố" })
  @ApiResponse({ status: 201, type: ProvinceDto })
  create(@Body() createProvinceDto: CreateProvinceDto) {
    return this.provinceService.create(createProvinceDto);
  }

  @Get()
  @ApiOperation({ summary: "Lấy danh sách hoặc tìm kiếm tỉnh/thành phố" })
  @ApiResponse({ status: 200, type: [ProvinceDto] })
  findAll(@Query() query: SearchProvinceDto) {
    return this.provinceService.findAll(query);
  }

  @Get(":code")
  @ApiOperation({ summary: "Lấy thông tin chi tiết một tỉnh bằng mã code" })
  @ApiResponse({ status: 200, type: ProvinceDto })
  findOne(@Param("code") code: string) {
    return this.provinceService.findOne(code);
  }

  @Patch(":code")
  @ApiOperation({ summary: "Cập nhật thông tin tỉnh/thành phố" })
  @ApiResponse({ status: 200, type: ProvinceDto })
  update(
    @Param("code") code: string,
    @Body() updateProvinceDto: UpdateProvinceDto,
  ) {
    return this.provinceService.update(code, updateProvinceDto);
  }

  @Delete(":code")
  @ApiOperation({ summary: "Xóa một tỉnh/thành phố" })
  @ApiResponse({ status: 200, description: "Xóa thành công" })
  remove(@Param("code") code: string) {
    return this.provinceService.remove(code);
  }
}
