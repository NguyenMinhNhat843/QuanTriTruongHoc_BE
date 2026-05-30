import { Body, Controller, Post } from "@nestjs/common";
import { ScheduleService } from "./studySchedule.service";
import { CreateStudyScheduleDto } from "./studySchedule.dto";
import { ApiBody, ApiOperation, ApiResponse } from "@nestjs/swagger";

@Controller("schedule")
export class ScheduleController {
  constructor(private scheduleService: ScheduleService) {}

  @Post("generate-schedule")
  @ApiOperation({ summary: "Tạo lịch học cho 1 lớp, 1 học kỳ" })
  @ApiResponse({ status: 201, description: "Tạo tiến độ đào tạo thành công" })
  @ApiBody({ type: [CreateStudyScheduleDto] })
  async generateScheduleForAClass(@Body() body: CreateStudyScheduleDto[]) {
    return await this.scheduleService.generateScheduleForAClass(body);
  }
}
