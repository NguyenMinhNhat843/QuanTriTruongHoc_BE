import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { CreateTrainingProgressDto } from "./dto/training-progreee.dto";
import { TrainingProgressService } from "./training-progress.service";

@Controller("training-progress")
export class TrainingProgressController {
  constructor(private readonly trainingService: TrainingProgressService) {}

  /**
   * API: Lấy dữ liệu bảng kế hoạch giảng dạy của 1 học kỳ, 1 lớp
   * GET /training-progress/study-schedule?classId=1&semesterId=2
   */
  @Get("study-schedule")
  async getStudySchedule(
    @Query("classId", ParseIntPipe) classId: number,
    @Query("semesterId", ParseIntPipe) semesterId: number,
  ) {
    return await this.trainingService.getStudySchedule(classId, semesterId);
  }

  /**
   * API: Tạo tiến độ đào tạo (Lớp học phần và lịch học)
   * POST /training-progress/training-progress
   */
  @Post("training-progress")
  @HttpCode(HttpStatus.CREATED) // Trả về 201 Created khi thành công
  async createTrainingProgress(@Body() body: CreateTrainingProgressDto) {
    return await this.trainingService.createTrainingProgress(body);
  }
}
