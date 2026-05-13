import { Controller, Get, Post, Body, Param } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from "@nestjs/swagger";
import { AdmissionService } from "./admission.service";
import { CreateAdmissionDto } from "./admission.dto";
import { AdmissionResponseDto } from "./admission.response";

@ApiTags("Admission (Đợt tuyển sinh)")
@Controller("admissions")
export class AdmissionController {
  constructor(private readonly admissionService: AdmissionService) {}

  @Post()
  @ApiOperation({ summary: "Tạo đợt tuyển sinh mới kèm danh mục ngành/khóa" })
  @ApiResponse({
    status: 201,
    description: "Tạo thành công.",
    type: AdmissionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Dữ liệu đầu vào không hợp lệ hoặc BatchID không tồn tại.",
  })
  async create(@Body() createAdmissionDto: CreateAdmissionDto) {
    return await this.admissionService.create(createAdmissionDto);
  }

  @Get()
  @ApiOperation({ summary: "Lấy danh sách tất cả các đợt tuyển sinh" })
  @ApiResponse({
    status: 200,
    description: "Lấy danh sách thành công.",
    type: [AdmissionResponseDto],
  })
  async findAll() {
    return await this.admissionService.findAll();
  }

  // findone
  @Get(":id")
  @ApiOperation({ summary: "Lấy chi tiết một đợt tuyển sinh theo ID" })
  @ApiResponse({
    status: 200,
    description: "Lấy chi tiết thành công.",
    type: AdmissionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Không tìm thấy đợt tuyển sinh với ID đã cho.",
  })
  @ApiParam({
    name: "id",
    description: "ID của đợt tuyển sinh",
    type: Number,
    example: 1,
  })
  async findOne(@Param("id") id: string) {
    return await this.admissionService.findOne(Number(id));
  }
}
