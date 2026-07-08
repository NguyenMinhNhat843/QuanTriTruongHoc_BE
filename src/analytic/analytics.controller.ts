import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import {
  OverviewStatsResponseDto,
  GrowthChartsResponseDto,
} from "./dto/analytics-response.dto";
import { StatisticsService } from "./service/statistics.service";
import { ChartService } from "./service/chart.service";

@ApiTags("Analytics & Statistics") // Nhóm các API này lại trên giao diện Swagger UI
@Controller("analytics")
export class AnalyticsController {
  constructor(
    private readonly statisticsService: StatisticsService,
    private readonly chartService: ChartService,
  ) {}

  @Get("overview")
  @ApiOperation({ summary: "Lấy số liệu thống kê tổng quan hệ thống" })
  @ApiResponse({
    status: 200,
    description: "Thống kê tổng quan thành công.",
    type: OverviewStatsResponseDto,
  })
  async getOverview() {
    return this.statisticsService.getOverviewStats();
  }

  @Get("growth-charts")
  @ApiOperation({
    summary: "Lấy dữ liệu biểu đồ tăng trưởng học sinh theo thời gian (Tháng)",
  })
  @ApiResponse({
    status: 200,
    description: "Lấy dữ liệu biểu đồ thành công.",
    type: GrowthChartsResponseDto,
  })
  async getGrowthCharts() {
    return this.chartService.getStudentGrowthCharts();
  }
}
