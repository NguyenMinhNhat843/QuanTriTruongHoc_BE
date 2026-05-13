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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from "@nestjs/swagger";
import { ApplicationService } from "./application.service";
import {
  CreateApplyApplicationDto,
  UpdateApplicationDto,
} from "./applyAdmission.dto";
import { ApplycationAdmissionStatus } from "../../prisma/generated/prisma/enums";
import {
  ApplicationResponseDto,
  ApplicationStatsResponseDto,
} from "./application.response";

@ApiTags("Applications (Đơn ứng tuyển)") // Nhóm các API này lại trên UI Swagger
@Controller("applications")
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Post()
  @ApiOperation({
    summary: "Nộp đơn ứng tuyển mới",
    description:
      "Thí sinh gửi thông tin cá nhân và dữ liệu điểm số để ứng tuyển vào một ngành học.",
  })
  @ApiResponse({
    status: 201,
    description: "Nộp đơn thành công.",
    type: ApplicationResponseDto,
  })
  @ApiResponse({ status: 400, description: "Dữ liệu đầu vào không hợp lệ." })
  create(@Body() createDto: CreateApplyApplicationDto) {
    return this.applicationService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: "Lấy danh sách các đơn ứng tuyển" })
  @ApiQuery({ name: "skip", required: false, type: Number, example: 0 })
  @ApiQuery({ name: "take", required: false, type: Number, example: 10 })
  @ApiQuery({
    name: "status",
    required: false,
    enum: ApplycationAdmissionStatus,
    description: "Lọc theo trạng thái hồ sơ",
  })
  @ApiQuery({
    name: "admissionItemId",
    required: false,
    type: Number,
    description: "Lọc theo ID mục tuyển sinh",
  })
  @ApiResponse({
    status: 200,
    description: "Trả về danh sách đơn ứng tuyển.",
    type: [ApplicationResponseDto],
  })
  findAll(
    @Query("skip") skip?: string,
    @Query("take") take?: string,
    @Query("status") status?: string,
    @Query("admissionItemId") admissionItemId?: string,
  ) {
    return this.applicationService.findAll({
      skip: skip ? +skip : undefined,
      take: take ? +take : undefined,
      status,
      admissionItemId: admissionItemId ? +admissionItemId : undefined,
    });
  }

  @Get("stats")
  @ApiOperation({
    summary: "Thống kê số lượng đơn theo trạng thái",
    description:
      "Trả về số lượng đơn cho mỗi trạng thái (PENDING, ADMITTED, ...)",
  })
  @ApiResponse({
    status: 200,
    description: "Dữ liệu thống kê cho Dashboard.",
    type: [ApplicationStatsResponseDto],
  })
  getStats() {
    return this.applicationService.getStats();
  }

  @Get(":id")
  @ApiOperation({ summary: "Lấy chi tiết một đơn ứng tuyển" })
  @ApiParam({ name: "id", description: "ID của đơn ứng tuyển", type: Number })
  @ApiResponse({
    status: 200,
    description: "Thông tin chi tiết đơn ứng tuyển.",
    type: ApplicationResponseDto,
  })
  @ApiResponse({ status: 404, description: "Không tìm thấy đơn ứng tuyển." })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.applicationService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Cập nhật đơn ứng tuyển",
    description:
      "Dùng để sửa thông tin cá nhân hoặc thay đổi trạng thái hồ sơ (Duyệt/Loại).",
  })
  @ApiParam({
    name: "id",
    description: "ID của đơn cần cập nhật",
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: "Cập nhật thành công.",
    type: ApplicationResponseDto,
  })
  @ApiResponse({ status: 404, description: "Không tìm thấy đơn để cập nhật." })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateApplicationDto,
  ) {
    return this.applicationService.update(id, updateDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Xóa đơn ứng tuyển" })
  @ApiParam({ name: "id", description: "ID của đơn cần xóa", type: Number })
  @ApiResponse({ status: 200, description: "Đã xóa đơn thành công." })
  @ApiResponse({ status: 404, description: "Không tìm thấy đơn để xóa." })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.applicationService.remove(id);
  }
}
