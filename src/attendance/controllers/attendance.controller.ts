import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { RoleType } from "../../../prisma/generated/prisma/enums.js";
import { GetUser } from "../../common/decorators/get-user.decorator"; // Bổ sung đúng đường dẫn của bạn
import { Roles } from "../../common/decorators/role.decorator"; // Bổ sung đúng đường dẫn của bạn
import {
  AttendanceDetailDto,
  AttendanceDto,
  AttendanceSheetResponseDto,
  CreateAttendanceDto,
  CreateBulkAttendanceDto,
} from "../dto/attendance.dto";
import { JwtAuthGuard } from "../../auth/guard/jwt-auth.guard.js";
import { RolesGuard } from "../../auth/guard/role.guard.js";
import { AttendanceService } from "../services/attendance.service.js";

@ApiTags("Attendance (Điểm danh)")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("attendance")
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  /**
   * 1. LẤY DANH SÁCH BẢN GHI ĐIỂM DANH (Có filter)
   */
  @Get()
  @Roles(RoleType.admin, RoleType.teacher, RoleType.staff)
  @ApiOperation({ summary: "Lấy danh sách bản ghi điểm danh (có bộ lọc)" })
  @ApiQuery({ name: "classSubjectId", required: false, type: Number })
  @ApiQuery({ name: "scheduleDetailId", required: false, type: Number })
  @ApiQuery({ name: "studentId", required: false, type: Number })
  @ApiResponse({ status: 200, type: [AttendanceDetailDto] })
  async findAll(
    @Query("classSubjectId") classSubjectId?: string,
    @Query("scheduleDetailId") scheduleDetailId?: string,
    @Query("studentId") studentId?: string,
  ) {
    return this.attendanceService.findAll({
      classSubjectId: classSubjectId ? Number(classSubjectId) : undefined,
      scheduleDetailId: scheduleDetailId ? Number(scheduleDetailId) : undefined,
      studentId: studentId ? Number(studentId) : undefined,
    });
  }

  /**
   * Lấy bảng điểm danh của 1 classSubject (Ma trận điểm danh) cho Frontend
   */
  @Get("sheet/:classSubjectId")
  @Roles(RoleType.admin, RoleType.teacher, RoleType.staff)
  @ApiOperation({ summary: "Lấy ma trận/bảng điểm danh cho Frontend" })
  @ApiResponse({ status: 200, type: AttendanceSheetResponseDto })
  async getAttendanceSheet(@Param("classSubjectId", ParseIntPipe) classSubjectId: number) {
    return this.attendanceService.getAttendanceSheet(classSubjectId);
  }

  /**
   * 2. LẤY CHI TIẾT 1 BẢN GHI ĐIỂM DANH
   */
  @Get(":id")
  @Roles(RoleType.admin, RoleType.teacher, RoleType.staff)
  @ApiOperation({ summary: "Lấy thông tin chi tiết 1 bản ghi điểm danh" })
  @ApiResponse({ status: 200, type: AttendanceDetailDto })
  async findOne(@Param("id", ParseIntPipe) id: number) {
    return this.attendanceService.findOne(id);
  }

  /**
   * 3. TẠO MỚI / ĐIỂM DANH 1 SINH VIÊN
   * Tự động lấy staffId từ Token làm recordedById
   */
  @Post()
  @Roles(RoleType.admin, RoleType.teacher)
  @ApiOperation({ summary: "Điểm danh cho 1 sinh viên" })
  @ApiResponse({ status: 201, type: AttendanceDto })
  async create(@Body() dto: CreateAttendanceDto, @GetUser("userId") userId: number | null) {
    return this.attendanceService.create(dto, userId);
  }

  /**
   * 4. ĐIỂM DANH HÀNG LOẠT CẢ LỚP (BULK UPSERT)
   */
  @Post("bulk")
  @Roles(RoleType.admin, RoleType.teacher)
  @ApiOperation({ summary: "Lưu điểm danh hàng loạt cho cả lớp học" })
  async bulkAttendance(
    @GetUser("userId") userId: number,
    @Body()
    body: CreateBulkAttendanceDto,
  ) {
    return this.attendanceService.bulkAttendance(body, userId);
  }

  /**
   * 5. CẬP NHẬT THÔNG TIN ĐIỂM DANH
   */
  @Patch(":id")
  @Roles(RoleType.admin, RoleType.teacher)
  @ApiOperation({ summary: "Cập nhật lại điểm danh của 1 sinh viên" })
  @ApiResponse({ status: 200, type: AttendanceDto })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: Partial<CreateAttendanceDto>,
    @GetUser("userId") userId: number | null,
  ) {
    return this.attendanceService.update(id, dto, userId);
  }

  /**
   * 6. XÓA BẢN GHI ĐIỂM DANH
   */
  @Delete(":id")
  @Roles(RoleType.admin)
  @ApiOperation({ summary: "Xóa 1 bản ghi điểm danh (Chỉ Admin)" })
  async remove(@Param("id", ParseIntPipe) id: number) {
    return this.attendanceService.remove(id);
  }
}
