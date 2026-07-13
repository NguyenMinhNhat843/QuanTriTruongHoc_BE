import { Controller, Get, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { StatisticsService } from "./service/statistics.service";
import { ChartService } from "./service/chart.service";
import {
  AcademicPerformanceResponseDto,
  GrowthChartsResponseDto,
  MajorDistributionResponseDto,
} from "./dto/dashboard-chart.dto";
import { AdvancedAnalyticsResponseDto } from "./dto/operation-detail.dto";
import { OverviewStatsResponseDto } from "./dto/get-overview-stat.dto";
import { JwtAuthGuard } from "../auth/guard/jwt-auth.guard";
import { RolesGuard } from "../auth/guard/role.guard";
import { Roles } from "../common/decorators/role.decorator";
import { RoleType } from "../../prisma/generated/prisma/enums";

@ApiTags("Analytics & Statistics")
@ApiBearerAuth()
@Controller("analytics")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(
    private readonly statisticsService: StatisticsService,
    private readonly chartService: ChartService,
  ) {}

  @Get("operation-details")
  @Roles(RoleType.admin, RoleType.staff)
  @ApiOperation({
    summary: "Lấy số liệu phân tích vận hành và nề nếp nâng cao",
  })
  @ApiResponse({
    status: 200,
    description: "Lấy dữ liệu phân tích nâng cao thành công.",
    type: AdvancedAnalyticsResponseDto,
  })
  async getOperationDetails() {
    return this.statisticsService.getAdvancedAnalytics();
  }

  @Get("overview")
  @Roles(RoleType.admin, RoleType.staff)
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
  @Roles(RoleType.admin, RoleType.staff)
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

  @Get("major-distribution")
  @ApiOperation({
    summary:
      "Lấy tỷ trọng học sinh đang theo học thực tế giữa các ngành (Pie Chart)",
  })
  @ApiResponse({
    status: 200,
    description: "Lấy dữ liệu tỷ trọng ngành học thành công.",
    type: [MajorDistributionResponseDto],
  })
  async getMajorDistribution(): Promise<MajorDistributionResponseDto[]> {
    return this.chartService.getMajorDistribution();
  }

  @Get("academic-performance")
  @ApiOperation({
    summary:
      "Phân tích tình hình phân bổ học lực theo từng lớp trong học kỳ hiện tại (Stacked Bar Chart)",
  })
  @ApiResponse({
    status: 200,
    description: "Lấy dữ liệu phân tích học lực theo lớp thành công.",
    type: [AcademicPerformanceResponseDto],
  })
  async getAcademicPerformance(): Promise<AcademicPerformanceResponseDto[]> {
    return this.chartService.getAcademicPerformanceByClass();
  }
}
