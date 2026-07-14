import {
  Controller,
  Get,
  UseGuards,
  UnauthorizedException,
  Query,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guard/jwt-auth.guard";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { TimeTableService } from "../service/time-table.service";
import { GetUser } from "../../common/decorators/get-user.decorator";
import {
  GetWeeklyScheduleQueryDto,
  TodayScheduleItemDto,
  WeeklyScheduleResponseDto,
} from "../dto/time-table.dto";

@ApiTags("Time-table")
@Controller("/time-table")
export class TimeTableController {
  constructor(private readonly timetableService: TimeTableService) {}

  /**
   * Endpoint: GET /api/student/home/today-schedule
   * Trả về danh sách môn học sinh viên cần đi học trong ngày hôm nay
   */
  @UseGuards(JwtAuthGuard) // Toàn bộ controller này cần đăng nhập sinh viên
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Lấy profile của sinh viên hiện tại dựa trên token JWT",
  })
  @ApiResponse({
    status: 200,
    type: [TodayScheduleItemDto],
  })
  @Get("home/today-schedule")
  async getTodaySchedule(@GetUser("studentId") studentId: number) {
    if (!studentId) {
      throw new UnauthorizedException(
        "Tài khoản không liên kết với thông tin sinh viên",
      );
    }

    return this.timetableService.getTodaySchedule(studentId);
  }

  @Get("weekly")
  @ApiOperation({
    summary: "Lấy thời khóa biểu theo tuần",
  })
  @ApiOkResponse({
    type: WeeklyScheduleResponseDto,
    isArray: true,
  })
  async getWeeklySchedule(
    @Query() query: GetWeeklyScheduleQueryDto,
  ): Promise<WeeklyScheduleResponseDto[]> {
    // Gọi sang hàm service đã viết riêng để xử lý gộp nhóm và flatten dữ liệu
    const scheduleData = await this.timetableService.getWeeklySchedule({
      weekNumber: query.weekNumber,
      semesterId: query.semesterId,
      classId: query.classId,
      studentId: query.studentId,
      teacherId: query.teacherId,
    });

    // Ép kiểu dữ liệu trả về map khớp hoàn toàn với DTO cấu trúc sạch của bạn
    return scheduleData as WeeklyScheduleResponseDto[];
  }
}
