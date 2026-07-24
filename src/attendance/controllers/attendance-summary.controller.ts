import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { RoleType } from "../../../prisma/generated/prisma/enums.js";
import { Roles } from "../../common/decorators/role.decorator"; // Điều chỉnh đường dẫn của bạn
import {
  AttendanceSummaryDetailDto,
  AttendanceSummaryDto,
  CreateAttendanceSummaryDto,
  SearchAttendanceSummaryDto,
  UpdateAttendanceSummaryDto,
} from "../dto/attendance-summary.dto";
import { JwtAuthGuard } from "../../auth/guard/jwt-auth.guard.js";
import { RolesGuard } from "../../auth/guard/role.guard.js";
import { AttendanceSummaryService } from "../services/attendance-summary.service.js";

@ApiTags("Attendance Summary (Tổng hợp chuyên cần & Xét thi)")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("attendance-summary")
export class AttendanceSummaryController {
  constructor(private readonly attendanceSummaryService: AttendanceSummaryService) {}

  /**
   * 1. TÌM KIẾM / LẤY DANH SÁCH TỔNG HỢP CHUYÊN CẦN
   */
  @Get()
  @Roles(RoleType.admin, RoleType.teacher, RoleType.staff)
  @ApiOperation({
    summary: "Lấy danh sách / Tra cứu tổng hợp chuyên cần & điều kiện thi",
  })
  @ApiResponse({ status: 200, type: [AttendanceSummaryDetailDto] })
  async findAll(@Query() query: SearchAttendanceSummaryDto) {
    return this.attendanceSummaryService.findAll(query);
  }

  /**
   * 2. LẤY CHI TIẾT 1 BẢN GHI TỔNG HỢP
   */
  @Get(":id")
  @Roles(RoleType.admin, RoleType.teacher, RoleType.staff)
  @ApiOperation({ summary: "Lấy chi tiết 1 bản ghi tổng hợp chuyên cần" })
  @ApiResponse({ status: 200, type: AttendanceSummaryDetailDto })
  async findOne(@Param("id", ParseIntPipe) id: number) {
    return this.attendanceSummaryService.findOne(id);
  }

  /**
   * 3. TẠO THỦ CÔNG BẢN GHI TỔNG HỢP
   */
  @Post()
  @Roles(RoleType.admin, RoleType.staff)
  @ApiOperation({ summary: "Tạo thủ công bản ghi tổng hợp chuyên cần" })
  @ApiResponse({ status: 201, type: AttendanceSummaryDto })
  async create(@Body() dto: CreateAttendanceSummaryDto) {
    return this.attendanceSummaryService.create(dto);
  }

  /**
   * 4. CẬP NHẬT TỔNG HỢP (Khóa tay, đổi trạng thái thi, chỉnh lý do)
   */
  @Patch(":id")
  @Roles(RoleType.admin, RoleType.staff)
  @ApiOperation({
    summary: "Cập nhật bản ghi tổng hợp (Khóa điều kiện thi, điều chỉnh trạng thái)",
  })
  @ApiResponse({ status: 200, type: AttendanceSummaryDto })
  async update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateAttendanceSummaryDto) {
    return this.attendanceSummaryService.update(id, dto);
  }

  /**
   * 5. KÍCH HOẠT TÍNH LẠI CHUYÊN CẦN THỦ CÔNG FOR 1 SINH VIÊN
   */
  @Post("recalculate")
  @Roles(RoleType.admin, RoleType.teacher, RoleType.staff)
  @ApiOperation({
    summary: "Yêu cầu tính toán lại % vắng mặt & xét điều kiện thi cho 1 SV",
  })
  @ApiResponse({ status: 200, type: AttendanceSummaryDto })
  async recalculate(
    @Body()
    body: {
      studentId: number;
      classSubjectId: number;
      allowThresholdPercent?: number;
    },
  ) {
    return this.attendanceSummaryService.recalculateSummary(
      body.studentId,
      body.classSubjectId,
      body.allowThresholdPercent,
    );
  }

  /**
   * 6. XÓA BẢN GHI TỔNG HỢP CHUYÊN CẦN
   */
  @Delete(":id")
  @Roles(RoleType.admin)
  @ApiOperation({ summary: "Xóa bản ghi tổng hợp chuyên cần (Chỉ Admin)" })
  async remove(@Param("id", ParseIntPipe) id: number) {
    return this.attendanceSummaryService.remove(id);
  }
}
