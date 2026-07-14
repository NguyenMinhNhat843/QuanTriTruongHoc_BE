import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { CourseRegistrationService } from "../service/grades.service";
import { SaveGradesDto } from "../dto/grades.dto";
import { JwtAuthGuard } from "../../auth/guard/jwt-auth.guard";
import { AcademicSummaryResponseDto } from "../dto/stat.dto";
import { StudentTranscriptResponseDto } from "../dto/grades.response";

@ApiTags("Quản lý Điểm (grade)")
@Controller("grades")
export class CourseRegistrationController {
  constructor(private readonly gradeService: CourseRegistrationService) {}

  @Post(":classSubjectId")
  @ApiOperation({
    summary: "Tạo bảng điểm cho một ClassSubject (Admin/Quản lý)",
  })
  async createGradesForClassSubject(
    @Query("classId", ParseIntPipe) classId: number,
    @Param("classSubjectId", ParseIntPipe) classSubjectId: number,
  ) {
    return await this.gradeService.createGradeTable(classId, classSubjectId);
  }

  @Get()
  @ApiOperation({
    summary: "Lấy bảng điểm (Admin/Quản lý)",
  })
  @ApiResponse({
    status: 200,
  })
  async findAll() {
    return await this.gradeService.getAll();
  }

  @Get("transcript")
  @ApiOperation({
    summary: "Lấy bảng điểm toàn khóa của học sinh",
  })
  @ApiResponse({
    status: 200,
    type: StudentTranscriptResponseDto,
  })
  @ApiQuery({ name: "studentId", required: true, type: Number })
  async getTranscript(@Query("studentId", ParseIntPipe) studentId: number) {
    return this.gradeService.getStudentTranscript(studentId);
  }

  @Get("summary-widget/:userId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Lấy thông tin tổng quan học tập của học sinh" })
  @ApiParam({ name: "userId", description: "ID của học sinh", example: 1 })
  @ApiResponse({
    status: 200,
    type: AcademicSummaryResponseDto,
  })
  async getAcademicSummaryWidget(
    @Param("userId", ParseIntPipe) userId: number,
  ) {
    const result = await this.gradeService.getAcademicSummaryWidget(userId);

    // NestJS tự động map return object thành HTTP 200 JSON response
    return {
      success: true,
      data: result,
    };
  }

  @Get(":id")
  @ApiOperation({ summary: "Xem chi tiết thông tin điểm 1 học sinh theo ID" })
  @ApiParam({ name: "id", description: "ID của bản ghi bảng điểm", example: 1 })
  @ApiResponse({
    status: 200,
  })
  async findOne(@Param("id", ParseIntPipe) id: number) {
    return await this.gradeService.getDetail(id);
  }

  @Patch("save-grades")
  @ApiOperation({ summary: "Lưu bảng điểm cho một ClassSubject" })
  async saveGrades(@Body() data: SaveGradesDto) {
    return await this.gradeService.saveGradeTable(data);
  }
}
