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
import { AdmissionProfileService } from "./admission-profile.service";
import {
  AdmissionProfileDto,
  CreateAdmissionProfileDto,
  ResponseAdmissionProfilePaginationDto,
  SearchAdmissionProfileDto,
  UpdateAdmissionProfileDto,
} from "./dto/admission-profile.dto";

@ApiTags("Admission Profile") // Gom nhóm API trên giao diện Swagger
@Controller("admission-profiles")
export class AdmissionProfileController {
  constructor(
    private readonly admissionProfileService: AdmissionProfileService,
  ) {}

  @Post()
  @ApiOperation({ summary: "Tạo mới hồ sơ tuyển sinh" })
  @ApiResponse({ type: AdmissionProfileDto })
  create(@Body() createDto: CreateAdmissionProfileDto) {
    return this.admissionProfileService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: "Lấy danh sách hồ sơ tuyển sinh (Phân trang)" })
  @ApiResponse({ type: ResponseAdmissionProfilePaginationDto, status: 200 })
  findAll(@Query() query: SearchAdmissionProfileDto) {
    return this.admissionProfileService.findAll(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Lấy thông tin chi tiết một hồ sơ tuyển sinh" })
  @ApiResponse({ type: AdmissionProfileDto })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.admissionProfileService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Cập nhật hồ sơ tuyển sinh" })
  @ApiResponse({ type: AdmissionProfileDto })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateAdmissionProfileDto,
  ) {
    return this.admissionProfileService.update(id, updateDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Xóa hồ sơ tuyển sinh" })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.admissionProfileService.remove(id);
  }
}
