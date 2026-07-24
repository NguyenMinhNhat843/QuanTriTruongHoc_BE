import { Module } from "@nestjs/common";
import { AttendanceController } from "./controllers/attendance.controller";
import { AttendanceService } from "./services/attendance.service";
import { AttendanceSummaryController } from "./controllers/attendance-summary.controller";
import { AttendanceSummaryService } from "./services/attendance-summary.service";

@Module({
  imports: [],
  controllers: [AttendanceController, AttendanceSummaryController],
  providers: [AttendanceService, AttendanceSummaryService],
  exports: [AttendanceService, AttendanceSummaryService],
})
export class AttendanceModule {}
