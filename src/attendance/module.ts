import { Module } from "@nestjs/common";
import { AttendanceController } from "./controllers/attendance.controller";
import { AttendanceService } from "./services/attendance.service";
import { AttendanceSummaryController } from "./controllers/attendance-summary.controller";

@Module({
  imports: [],
  controllers: [AttendanceController, AttendanceSummaryController],
  providers: [AttendanceService, AttendanceService],
  exports: [AttendanceService, AttendanceService],
})
export class AttendanceModule {}
