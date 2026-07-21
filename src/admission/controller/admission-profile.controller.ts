import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import {
  CreateAdmissionProfileDto,
  UpdateAdmissionProfileDto,
  SearchAdmissionProfileDto,
  AdmissionProfileDto,
  ResponseAdmissionProfilePaginationDto,
} from "../dto/admission-profile.dto";
import { AdmissionProfileService } from "../service/admission-profile.service";

@ApiTags("Admission Profiles")
@Controller("admission-profiles")
export class AdmissionProfileController {
  constructor(private readonly admissionProfileService: AdmissionProfileService) {}

  @Post()
  @ApiOperation({ summary: "Tạo mới hồ sơ tuyển sinh" })
  @ApiResponse({ status: 201, type: AdmissionProfileDto })
  create(@Body() createDto: CreateAdmissionProfileDto) {
    return this.admissionProfileService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: "Lấy danh sách hồ sơ tuyển sinh" })
  @ApiResponse({ status: 200, type: ResponseAdmissionProfilePaginationDto })
  findAll(@Query() query: SearchAdmissionProfileDto) {
    return this.admissionProfileService.findAll(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Lấy chi tiết hồ sơ tuyển sinh" })
  @ApiResponse({ status: 200, type: AdmissionProfileDto })
  @ApiResponse({ status: 404 })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.admissionProfileService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Cập nhật hồ sơ tuyển sinh" })
  @ApiResponse({ status: 200, type: AdmissionProfileDto })
  @ApiResponse({ status: 404 })
  update(@Param("id", ParseIntPipe) id: number, @Body() updateDto: UpdateAdmissionProfileDto) {
    return this.admissionProfileService.update(id, updateDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Xóa hồ sơ tuyển sinh" })
  @ApiResponse({ status: 200, type: AdmissionProfileDto })
  @ApiResponse({ status: 404 })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.admissionProfileService.remove(id);
  }
}
