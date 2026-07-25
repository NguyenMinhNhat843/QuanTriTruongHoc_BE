import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import {
  AddStudentToExamDto,
  CreateExamScheduleDto,
  ExamScheduleDetailDto,
  SearchExamScheduleDto,
  UpdateExamScheduleDto,
} from "../dto/exam-schedule.dto";
import { ExamScheduleService } from "../service/exam-schedule.service";

@ApiTags("Lịch Thi & Đợt Thi Kết Thúc Môn (Exam Schedule)")
@Controller("exam-schedules")
export class ExamScheduleController {
  constructor(private readonly examScheduleService: ExamScheduleService) {}

  @Post()
  @ApiOperation({ summary: "Tạo mới Lịch thi (Tự động lọc & gán Sinh viên vắng <= 20% vào đợt thi)" })
  @ApiResponse({ status: 201, type: ExamScheduleDetailDto })
  async create(@Body() createDto: CreateExamScheduleDto) {
    return this.examScheduleService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: "Lấy danh sách các Đợt thi / Lịch thi (Có lọc & phân trang)" })
  @ApiResponse({ status: 200 })
  async findAll(@Query() query: SearchExamScheduleDto, @Query("page") page?: number, @Query("limit") limit?: number) {
    return this.examScheduleService.findAll({
      ...query,
      page,
      limit,
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Lấy chi tiết Lịch thi (Kèm danh sách Sinh viên dự thi)" })
  @ApiParam({ name: "id", type: Number, description: "ID của Lịch thi" })
  @ApiResponse({
    status: 200,
    type: ExamScheduleDetailDto,
  })
  async findOne(@Param("id", ParseIntPipe) id: number) {
    return this.examScheduleService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Cập nhật thông tin Lịch thi" })
  @ApiParam({ name: "id", type: Number, description: "ID của Lịch thi" })
  @ApiResponse({
    status: 200,
    description: "Cập nhật lịch thi thành công.",
    type: ExamScheduleDetailDto,
  })
  async update(@Param("id", ParseIntPipe) id: number, @Body() updateDto: UpdateExamScheduleDto) {
    return this.examScheduleService.update(id, updateDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Xóa Lịch thi (Tự động xóa danh sách thi)" })
  @ApiParam({ name: "id", type: Number, description: "ID của Lịch thi" })
  @ApiResponse({
    status: 200,
    description: "Xóa lịch thi thành công.",
  })
  async remove(@Param("id", ParseIntPipe) id: number) {
    return this.examScheduleService.remove(id);
  }

  // ==========================================
  // NGHIỆP VỤ MỞ RỘNG (GÁN THỦ CÔNG & ĐỒNG BỘ)
  // ==========================================
  @Post("add-student")
  @ApiOperation({
    summary: "Thêm thủ công 1 Sinh viên vào Đợt thi (Trường hợp đặc biệt)",
  })
  @ApiResponse({
    status: 201,
    description: "Thêm sinh viên vào đợt thi thành công.",
  })
  async addStudentToExam(@Body() dto: AddStudentToExamDto) {
    return this.examScheduleService.addStudentToExam(dto.examScheduleId, dto.studentId);
  }

  @Post(":id/sync-attendance")
  @ApiOperation({
    summary:
      "Đồng bộ lại danh sách thi theo dữ liệu điểm danh mới nhất (Chỉ quét bù SV đủ điều kiện chưa có trong đợt thi)",
  })
  @ApiParam({ name: "id", type: Number, description: "ID của Lịch thi" })
  @ApiResponse({ status: 200, description: "Đồng bộ danh sách thi thành công." })
  async syncStudentsFromAttendance(@Param("id", ParseIntPipe) examScheduleId: number) {
    return this.examScheduleService.syncStudentsFromAttendance(examScheduleId);
  }
}
