import { Body, Controller, Get, Post, Query, Res } from "@nestjs/common";
import { ScheduleService } from "./studySchedule.service";
import {
  CreateStudyScheduleDto,
  ExportStudyScheduleDto,
  SearchStudyScheduleDto,
  StudyScheduleResponseDto,
} from "./studySchedule.dto";
import { ApiBody, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { Response } from "express";

@Controller("schedule")
export class ScheduleController {
  constructor(private scheduleService: ScheduleService) {}

  @Get()
  @ApiOperation({ summary: "Load study schedule của 1 lớp trong 1 kỳ" })
  @ApiResponse({ status: 200, type: [StudyScheduleResponseDto] })
  async loadStudySchedule(@Query() query: SearchStudyScheduleDto) {
    return await this.scheduleService.loadStudySchedule(query);
  }

  @Post("generate-schedule")
  @ApiOperation({ summary: "Tạo lịch học cho 1 lớp, 1 học kỳ" })
  @ApiResponse({ status: 201, description: "Tạo tiến độ đào tạo thành công" })
  @ApiBody({ type: [CreateStudyScheduleDto] })
  async generateScheduleForAClass(@Body() body: CreateStudyScheduleDto[]) {
    return await this.scheduleService.generateScheduleForAClass(body);
  }

  /**
   * Xuất excel tiến độ đào tạo của 1 lớp trong 1 học kỳ
   */
  @Get("export-excel")
  @ApiOperation({
    summary: "Xuất excel tiến độ đào tạo của 1 lớp trong 1 học kỳ",
  })
  @ApiResponse({
    status: 200,
    description: "Xuất excel thành công. Trả về file nhị phân (stream).",
    schema: { type: "string", format: "binary" }, // Định nghĩa cho Swagger hiển thị nút Download file
  })
  async exportStudyScheduleToExcel(
    @Query() query: ExportStudyScheduleDto,
    @Res() res: Response,
  ) {
    // 1. Gọi service để lấy dữ liệu dạng Buffer
    const buffer = await this.scheduleService.exportStudyScheduleToExcel(query);

    // 2. Định nghĩa tên file khi tải về (Ví dụ: Tien_Do_Dao_Tao_Lop_1.xlsx)
    const fileName = `Tien_Do_Dao_Tao_Class_${query.classId}_Sem_${query.semesterId}.xlsx`;

    // 3. Thiết lập các header bắt buộc dành cho việc tải File Excel
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

    // 4. Trả file về cho client
    return res.end(buffer);
  }
}
