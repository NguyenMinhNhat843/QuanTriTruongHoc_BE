import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { AssessmentService } from "../service/assessment.service";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import {
  CriterionDto,
  EvaluationPeriodDto,
  ResponseAssessmentDtoWithRelation,
  ResponseEvaluationPeriodDtoWithRelation,
} from "../assessment-response.dto";
import {
  CreateCriterionDto,
  CreatePeriodDto,
  EvaluationSummaryDataDto,
  LoadAssessmentDto,
  UpdateAssessmentDto,
  UpdatePeriodDto,
} from "../assessment.dto";
import { GetUser } from "../../common/decorators/get-user.decorator";
import { JwtAuthGuard } from "../../auth/guard/jwt-auth.guard";
import { RolesGuard } from "../../auth/guard/role.guard";
import { Roles } from "../../common/decorators/role.decorator";
import { RoleType } from "../../../prisma/generated/prisma/enums";

@Controller("assessment")
@ApiBearerAuth()
@ApiTags("Assessment")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  // Create Criteria: Tiêu chí chấm điểm
  @Post("criteria")
  @Roles(RoleType.admin, RoleType.staff)
  @ApiOperation({ summary: "Tạo tiêu chí chấm điểm" })
  @ApiResponse({
    status: 201,
    description: "Tiêu chí chấm điểm được tạo thành công",
    type: CriterionDto,
  })
  async createCriteria(@Body() createCriterionDto: CreateCriterionDto) {
    return this.assessmentService.createCriteria(createCriterionDto);
  }

  // Update Criteria: Cập nhật tiêu chí chấm điểm
  @Patch("criteria/:id")
  @Roles(RoleType.admin, RoleType.staff)
  @ApiOperation({ summary: "Cập nhật tiêu chí chấm điểm" })
  @ApiResponse({
    status: 200,
    description: "Tiêu chí chấm điểm được cập nhật thành công",
    type: CriterionDto,
  })
  async updateCriteria(
    @Body() updateCriterionDto: CreateCriterionDto,
    @Param("id") id: number,
  ) {
    return this.assessmentService.updateCriteria(id, updateCriterionDto);
  }

  // Delete Criteria: Xóa tiêu chí chấm điểm
  @Delete("criteria/:id")
  @Roles(RoleType.admin, RoleType.staff)
  @ApiOperation({ summary: "Xóa tiêu chí chấm điểm" })
  @ApiResponse({
    status: 200,
    description: "Tiêu chí chấm điểm được xóa thành công",
    type: CriterionDto,
  })
  async deleteCriteria(@Param("id") id: number) {
    return this.assessmentService.deleteCriteria(id);
  }

  /**
   * Trả về tóm tắt trạng thái chấm điểm rèn luyện hiển thị ở Widget trang chủ
   */
  @Get("home/evaluation-summary")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      "Lấy tóm tắt trạng thái chấm điểm rèn luyện của sinh viên hiện tại",
  })
  @ApiResponse({
    status: 200,
    type: EvaluationSummaryDataDto,
  })
  async getEvaluationSummary(@GetUser("studentId") studentId: number) {
    if (!studentId) {
      throw new UnauthorizedException(
        "Tài khoản không liên kết với thông tin sinh viên",
      );
    }

    return this.assessmentService.getEvaluationSummary(studentId);
  }

  // Lấy tiêu chí chấm điểm
  @Get("criteria")
  @ApiOperation({ summary: "Lấy danh sách tiêu chí chấm điểm" })
  @ApiResponse({
    status: 200,
    type: [CriterionDto],
  })
  async getAllCriteria() {
    return this.assessmentService.getAllCriteria();
  }

  // ============ Evaluate Period: Api Đợt đánh giá ============
  @Post("periods")
  @Roles(RoleType.admin, RoleType.staff)
  @ApiOperation({ summary: "Tạo mới một đợt đánh giá kèm các tiêu chí" })
  async create(@Body() createPeriodDto: CreatePeriodDto) {
    return await this.assessmentService.createPeriod(createPeriodDto);
  }

  @Get("periods")
  @ApiOperation({
    summary: "Lấy danh sách tất cả các đợt đánh giá kèm quan hệ",
  })
  @ApiResponse({
    status: 200,
    type: [EvaluationPeriodDto],
  })
  @Roles(RoleType.admin, RoleType.staff)
  async findAll() {
    return await this.assessmentService.getAllPeriods();
  }

  @Get("periods/:id")
  @Roles(RoleType.admin, RoleType.staff)
  @ApiOperation({
    summary: "Lấy chi tiết một đợt đánh giá",
  })
  @ApiResponse({
    status: 200,
    type: ResponseEvaluationPeriodDtoWithRelation,
  })
  async findDetail(@Param("id", ParseIntPipe) id: number) {
    return await this.assessmentService.getDetailPeriod(id);
  }

  @Patch("periods/:id")
  @Roles(RoleType.admin, RoleType.staff)
  @ApiOperation({
    summary: "Cập nhật thông tin đợt đánh giá và đồng bộ lại tiêu chí",
  })
  @ApiParam({ name: "id", description: "ID của đợt đánh giá", type: Number })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updatePeriodDto: UpdatePeriodDto,
  ) {
    return await this.assessmentService.updatePeriod(id, updatePeriodDto);
  }

  @Delete("periods/:id")
  @Roles(RoleType.admin, RoleType.staff)
  @ApiOperation({
    summary: "Xóa đợt đánh giá và các liên kết tiêu chí liên quan",
  })
  @ApiParam({ name: "id", description: "ID của đợt đánh giá", type: Number })
  async remove(@Param("id", ParseIntPipe) id: number) {
    return await this.assessmentService.deletePeriod(id);
  }

  // ===== Assessment: API cho bảng phiếu điểm của từng học sinh =====
  @Get("load")
  @HttpCode(HttpStatus.OK) // Thay vì 201 Created mặc định của POST, trả về 200 OK vì bản chất là "Load" dữ liệu
  @ApiOperation({
    summary: "Lấy hoặc tạo phiếu điểm rèn luyện cho học sinh trong học kỳ",
  })
  @ApiResponse({
    type: ResponseAssessmentDtoWithRelation,
    status: 200,
  })
  @UsePipes(new ValidationPipe({ transform: true })) // Tự động ép kiểu dữ liệu từ DTO
  async loadAssessment(@Query() loadAssessmentDto: LoadAssessmentDto) {
    return await this.assessmentService.getOrCreateAssessment(
      loadAssessmentDto,
    );
  }

  @Post("submit")
  @ApiOperation({
    summary: "Cập nhật phiếu điểm rèn luyện cho học sinh",
  })
  @ApiResponse({
    type: ResponseAssessmentDtoWithRelation,
    status: 200,
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async updateAssessment(@Body() updateAssessmentDto: UpdateAssessmentDto) {
    return await this.assessmentService.updateAssessment(updateAssessmentDto);
  }
}
