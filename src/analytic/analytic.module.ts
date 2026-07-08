import { Module } from "@nestjs/common";
import { AnalyticsController } from "./analytics.controller";
import { PrismaModule } from "../prisma/prisma.module"; // Thay đổi đường dẫn tới PrismaModule của bạn
import { ChartService } from "./service/chart.service";
import { StatisticsService } from "./service/statistics.service";

@Module({
  imports: [PrismaModule], // Cung cấp PrismaService cho các service bên dưới
  controllers: [AnalyticsController],
  providers: [StatisticsService, ChartService],
})
export class AnalyticsModule {}
