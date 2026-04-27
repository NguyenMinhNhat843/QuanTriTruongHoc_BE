import { Controller, Get, Post, Body } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { AdmissionService } from "./admission.service";
import { CreateAdmissionDto } from "./admission.dto";

@ApiTags("Admission (Đợt tuyển sinh)")
@Controller("admissions")
export class AdmissionController {
  constructor(private readonly admissionService: AdmissionService) {}

  @Post()
  @ApiOperation({ summary: "Tạo đợt tuyển sinh mới kèm danh mục ngành/khóa" })
  @ApiResponse({ status: 201, description: "Tạo thành công." })
  @ApiResponse({
    status: 400,
    description: "Dữ liệu đầu vào không hợp lệ hoặc BatchID không tồn tại.",
  })
  async create(@Body() createAdmissionDto: CreateAdmissionDto) {
    return await this.admissionService.create(createAdmissionDto);
  }

  @Get()
  @ApiOperation({ summary: "Lấy danh sách tất cả các đợt tuyển sinh" })
  async findAll() {
    return await this.admissionService.findAll();
  }
}
