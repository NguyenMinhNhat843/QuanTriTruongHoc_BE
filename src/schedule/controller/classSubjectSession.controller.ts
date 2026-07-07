import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  Res,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import {
  CreateClassSubjectSessionDto,
  UpdateClassSubjectSessionDto,
  SearchClassSubjectSessionDto,
  ClassSubjectSessionDto,
} from "../dto/classSubjectSession.dto";
import { ClassSubjectSessionService } from "../service/classSubjectSession.service";
import { TrainingPlanService } from "../service/trainingProgress.service";
import {
  ResponseTrainingProgress,
  UpsertTrainingPlanDto,
} from "../dto/training-progress.dto";
import { Response } from "express";

@ApiTags("class-subject-session")
@Controller("class-subject-session")
export class ClassSubjectSessionController {
  constructor(
    private readonly sessionService: ClassSubjectSessionService,
    private readonly trainingPlanService: TrainingPlanService,
  ) {}

  @Post()
  @ApiOperation({ summary: "Create new class subject session" })
  @ApiResponse({ status: 201, type: ClassSubjectSessionDto })
  async create(@Body() createDto: CreateClassSubjectSessionDto) {
    return this.sessionService.create(createDto);
  }

  @Post("upsert-plan-training")
  @ApiOperation({
    summary: "Tạo hoặc Cập nhật kế hoạch đào tạo cho môn học",
  })
  @ApiResponse({
    status: 201,
  })
  async upsertTrainingPlan(@Body() upsertDto: UpsertTrainingPlanDto) {
    return this.trainingPlanService.upsertTrainingPlan(upsertDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all class subject sessions matching query" })
  @ApiResponse({ status: 200, type: [ClassSubjectSessionDto] })
  async findAll(@Query() query: SearchClassSubjectSessionDto) {
    return this.sessionService.findAll(query);
  }

  @Get("plan-training")
  @ApiOperation({
    summary: "Lấy kế hoạch đào tạo theo Lớp và Học kỳ",
    description:
      "Lấy toàn bộ môn học trong Chương trình khung của lớp tại học kỳ đó. Môn nào chưa được xếp lịch (chưa có CourseOffer) thì các trường lịch và giáo viên sẽ trả về null/mảng rỗng.",
  })
  @ApiQuery({ name: "classId", type: Number })
  @ApiQuery({ name: "semesterId", type: Number })
  @ApiResponse({ status: 200, type: [ResponseTrainingProgress] })
  async getTrainingPlan(
    @Query("classId", ParseIntPipe) classId: number,
    @Query("semesterId", ParseIntPipe) semesterId: number,
  ) {
    return this.trainingPlanService.getTrainingPlan(classId, semesterId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get details of a class subject session" })
  @ApiParam({ name: "id", type: Number })
  @ApiResponse({ status: 200, type: ClassSubjectSessionDto })
  async findOne(@Param("id") id: string) {
    return this.sessionService.findOne(Number(id));
  }

  @Put(":id")
  @ApiOperation({ summary: "Update a class subject session" })
  @ApiParam({ name: "id", type: Number })
  @ApiResponse({ status: 200, type: ClassSubjectSessionDto })
  async update(
    @Param("id") id: string,
    @Body() updateDto: UpdateClassSubjectSessionDto,
  ) {
    return this.sessionService.update(Number(id), updateDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a class subject session" })
  @ApiParam({ name: "id", type: Number })
  @ApiResponse({ status: 200 })
  async remove(@Param("id") id: string) {
    return this.sessionService.remove(Number(id));
  }

  @Get("training-plan/export-excel")
  @ApiOperation({
    summary: "Xuất file Excel kế hoạch đào tạo của lớp học",
  })
  @ApiQuery({ name: "classId", type: Number })
  @ApiQuery({ name: "semesterId", type: Number })
  async exportExcel(
    @Query("classId", ParseIntPipe) classId: number,
    @Query("semesterId", ParseIntPipe) semesterId: number,
    @Res() res: Response,
  ) {
    // 1. Validate dữ liệu đầu vào từ Query String
    if (!classId || !semesterId) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: "Thiếu tham số classId hoặc semesterId bắt buộc.",
      });
    }

    if (isNaN(classId) || !semesterId) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: "Tham số truyền vào phải là định dạng số (Number).",
      });
    }

    try {
      // 3. Gọi service để ghi đè stream và trả file trực tiếp thông qua đối tượng Response (res)
      await this.trainingPlanService.exportTrainingPlanExcel(
        classId,
        semesterId,
        res,
      );
    } catch (error: any) {
      // Cắt/bắt lỗi nếu trong quá trình export xảy ra exception (Ví dụ: Không tìm thấy lớp, lỗi DB...)
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || "Có lỗi xảy ra khi xuất file excel.",
      });
    }
  }
}
