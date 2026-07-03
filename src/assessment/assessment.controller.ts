import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { AssessmentService } from "./assessment.service";
import {
  CreatePeriodDto,
  CreateCriterionDto,
  SubmitAssessmentDto,
  ApproveAssessmentDto,
} from "./assessment.dto";
import { JwtAuthGuard } from "../auth/guard/jwt-auth.guard";
import { RolesGuard } from "../auth/guard/role.guard";
import { Roles } from "../common/decorators/role.decorator";
import { RoleType } from "../../prisma/generated/prisma/enums";
import { GetUser } from "../common/decorators/get-user.decorator";

@ApiTags("Assessment (Quản lý Điểm rèn luyện)")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("assessment")
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) { }

  // =========================================================================
  // 1. ENDPOINTS DÀNH CHO PHÒNG CTHS (ADMIN / STAFF)
  // =========================================================================

  @Post("periods")
  @Roles(RoleType.admin, RoleType.staff)
  @ApiOperation({ summary: "Phòng CTHS: Khởi tạo đợt đánh giá mới" })
  createPeriod(@Body() dto: CreatePeriodDto) {
    return this.assessmentService.createPeriod(dto);
  }

  @Post("criteria")
  @Roles(RoleType.admin, RoleType.staff)
  @ApiOperation({ summary: "Phòng CTHS: Tạo tiêu chí chấm điểm chuẩn" })
  createCriterion(@Body() dto: CreateCriterionDto) {
    return this.assessmentService.createCriterion(dto);
  }

  @Post("periods/:id/freeze")
  @Roles(RoleType.admin, RoleType.staff)
  @ApiOperation({ summary: "Phòng CTHS: Khóa đợt đánh giá & công bố kết quả (Tính toán xếp loại tự động)" })
  freezePeriod(@Param("id", ParseIntPipe) id: number) {
    return this.assessmentService.freezePeriod(id);
  }

  // =========================================================================
  // 2. ENDPOINTS CHUNG (ĐÃ ĐĂNG NHẬP)
  // =========================================================================

  @Get("periods")
  @Roles(RoleType.admin, RoleType.staff, RoleType.teacher, RoleType.student)
  @ApiOperation({ summary: "Lấy danh sách các đợt đánh giá" })
  getPeriods() {
    return this.assessmentService.getPeriods();
  }

  @Get("criteria")
  @Roles(RoleType.admin, RoleType.staff, RoleType.teacher, RoleType.student)
  @ApiOperation({ summary: "Lấy danh sách tiêu chí chấm điểm chuẩn" })
  getCriteria() {
    return this.assessmentService.getCriteria();
  }

  // =========================================================================
  // 3. ENDPOINTS DÀNH CHO HỌC SINH (STUDENT)
  // =========================================================================

  @Get("student/my-assessment")
  @Roles(RoleType.student)
  @ApiOperation({ summary: "Học sinh: Lấy phiếu điểm rèn luyện cá nhân trong đợt" })
  @ApiQuery({ name: "periodId", type: Number, required: true, description: "ID đợt đánh giá" })
  getMyAssessment(
    @GetUser("id") userId: number,
    @Query("periodId", ParseIntPipe) periodId: number,
  ) {
    return this.assessmentService.getMyAssessment(userId, periodId);
  }

  @Post("student/submit")
  @Roles(RoleType.student)
  @ApiOperation({ summary: "Học sinh: Tự đánh giá và nộp phiếu rèn luyện (Trạng thái chuyển sang PENDING)" })
  submitAssessment(
    @GetUser("id") userId: number,
    @Body() dto: SubmitAssessmentDto,
  ) {
    return this.assessmentService.submitAssessment(userId, dto);
  }

  // =========================================================================
  // 4. ENDPOINTS DÀNH CHO GIÁO VIÊN CHỦ NHIỆM (TEACHER)
  // =========================================================================

  @Get("teacher/class-students")
  @Roles(RoleType.teacher)
  @ApiOperation({ summary: "GVCN: Xem danh sách học sinh của lớp mình chủ nhiệm kèm trạng thái phiếu rèn luyện" })
  @ApiQuery({ name: "periodId", type: Number, required: true, description: "ID đợt đánh giá" })
  getClassStudentsAssessments(
    @GetUser("id") userId: number,
    @Query("periodId", ParseIntPipe) periodId: number,
  ) {
    return this.assessmentService.getClassStudentsAssessments(userId, periodId);
  }

  @Get("teacher/student-assessment/:id")
  @Roles(RoleType.teacher)
  @ApiOperation({ summary: "GVCN: Xem chi tiết phiếu rèn luyện của một học sinh trong lớp" })
  getStudentAssessmentForTeacher(
    @GetUser("id") userId: number,
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.assessmentService.getStudentAssessmentForTeacher(userId, id);
  }

  @Post("teacher/approve")
  @Roles(RoleType.teacher)
  @ApiOperation({ summary: "GVCN: Chấm điểm điều chỉnh, nhận xét và Duyệt phiếu rèn luyện (APPROVED)" })
  approveAssessment(
    @GetUser("id") userId: number,
    @Body() dto: ApproveAssessmentDto,
  ) {
    return this.assessmentService.approveAssessment(userId, dto);
  }
}
