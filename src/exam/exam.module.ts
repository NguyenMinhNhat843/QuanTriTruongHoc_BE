import { Module } from "@nestjs/common";
import { ExamScheduleController } from "./controller/exam-schedule.controller";
import { StudentExamDetailController } from "./controller/student-exam-detail.controller";
import { ExamScheduleService } from "./service/exam-schedule.service";
import { StudentExamDetailService } from "./service/student-exam-detail.service";

@Module({
  imports: [],
  controllers: [ExamScheduleController, StudentExamDetailController],
  providers: [ExamScheduleService, StudentExamDetailService],
  exports: [ExamScheduleService, StudentExamDetailService],
})
export class ExamModule {}
