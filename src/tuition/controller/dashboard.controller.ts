import {
  Controller,
  Get,
  Query,
  ParseIntPipe,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiQuery,
  ApiOkResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { DashboardService } from "../service/dashboard.service";
import {
  PaymentTrendResponseDto,
  TuitionOverviewResponseDto,
} from "../dto/dashboard.dto";
import { JwtAuthGuard } from "../../auth/guard/jwt-auth.guard";

@ApiTags("Dashboard Tài Chính Học Phí")
@Controller("tuition-dashboard")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("tuition-overview")
  @ApiQuery({ name: "periodId" })
  @ApiOkResponse({ type: TuitionOverviewResponseDto })
  async getOverview(
    @Query("periodId", ParseIntPipe) periodId: number,
  ): Promise<TuitionOverviewResponseDto> {
    return this.dashboardService.getTuitionOverview(periodId);
  }

  @Get("payment-trend")
  @ApiQuery({ name: "periodId" })
  @ApiOkResponse({ type: [PaymentTrendResponseDto] })
  async getTrend(
    @Query("periodId", ParseIntPipe) periodId: number,
  ): Promise<PaymentTrendResponseDto[]> {
    return this.dashboardService.getPaymentTrend(periodId);
  }
}
