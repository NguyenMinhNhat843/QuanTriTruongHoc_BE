import { Module } from "@nestjs/common";
import { ScheduleController } from "./studySchedule.controller";
import { ScheduleService } from "./studySchedule.service";

@Module({
  imports: [],
  providers: [ScheduleService],
  controllers: [ScheduleController],
  exports: [ScheduleService],
})
export class StudyScheduleModule {}
