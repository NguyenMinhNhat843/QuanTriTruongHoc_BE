import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from "@nestjs/swagger";
import { GradeComponentService } from "./grade.service";
import { GradeComponentDto } from "./grade.response";
import {
  CreateGradeComponentDto,
  GradeComponentParamDto,
  UpdateGradeComponentDto,
} from "./grade.dto";

@ApiTags("Cấu hình loại điểm (Grade Component)")
@Controller("grade-components")
@UseInterceptors(ClassSerializerInterceptor) // Kích hoạt bộ lọc DTO Expose/Transform
export class GradeComponentController {
  constructor(private readonly gradeComponentService: GradeComponentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Tạo mới một cấu hình loại điểm" })
  @ApiResponse({
    status: 201,
    description: "Tạo thành công đầu điểm.",
    type: GradeComponentDto,
  })
  @ApiResponse({
    status: 400,
    description: "Yêu cầu không hợp lệ hoặc tổng trọng số vượt quá 100%.",
  })
  async create(
    @Body() createDto: CreateGradeComponentDto,
  ): Promise<GradeComponentDto> {
    return await this.gradeComponentService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: "Lấy danh sách tất cả các loại điểm hiện có" })
  @ApiResponse({
    status: 200,
    description: "Trả về danh sách loại điểm sắp xếp theo ID tăng dần.",
    type: [GradeComponentDto],
  })
  async findAll(): Promise<GradeComponentDto[]> {
    return await this.gradeComponentService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Xem chi tiết cấu hình loại điểm theo ID" })
  @ApiParam({ name: "id", description: "ID định danh đầu điểm", example: 1 })
  @ApiResponse({
    status: 200,
    description: "Trả về thông tin chi tiết loại điểm.",
    type: GradeComponentDto,
  })
  @ApiResponse({ status: 404, description: "Không tìm thấy ID loại điểm." })
  async findOne(
    @Param() params: GradeComponentParamDto,
  ): Promise<GradeComponentDto> {
    return await this.gradeComponentService.findOne(params.id);
  }

  @Put(":id")
  @ApiOperation({ summary: "Cập nhật/Sửa đổi cấu hình loại điểm theo ID" })
  @ApiParam({ name: "id", description: "ID định danh đầu điểm", example: 1 })
  @ApiResponse({
    status: 200,
    description: "Cập nhật thành công thông tin đầu điểm.",
    type: GradeComponentDto,
  })
  @ApiResponse({
    status: 400,
    description:
      "Trọng số thay đổi khiến tổng cấu hình hệ thống vượt mức 100%.",
  })
  @ApiResponse({ status: 404, description: "Không tìm thấy ID loại điểm." })
  async update(
    @Param() params: GradeComponentParamDto,
    @Body() updateDto: UpdateGradeComponentDto,
  ): Promise<GradeComponentDto> {
    return await this.gradeComponentService.update(params.id, updateDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Xóa cấu hình loại điểm theo ID" })
  @ApiParam({ name: "id", description: "ID định danh đầu điểm", example: 1 })
  @ApiResponse({ status: 200, description: "Xóa thành công loại điểm." })
  @ApiResponse({
    status: 400,
    description:
      "Không thể xóa do cấu hình đang được sử dụng ở các bảng điểm học sinh.",
  })
  @ApiResponse({ status: 404, description: "Không tìm thấy ID loại điểm." })
  async remove(@Param() params: GradeComponentParamDto) {
    return await this.gradeComponentService.remove(params.id);
  }
}
