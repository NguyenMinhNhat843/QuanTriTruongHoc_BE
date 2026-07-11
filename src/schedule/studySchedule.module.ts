import { Module } from "@nestjs/common";
import { ClassSubjectSessionController } from "./controller/classSubjectSession.controller";
import { ClassSubjectScheduleDetailController } from "./controller/classSubjectScheduleDetail.controller";
import { ClassSubjectScheduleDetailService } from "./service/classSubjectScheduleDetail.service";
import { ClassSubjectSessionService } from "./service/classSubjectSession.service";
import { TrainingPlanService } from "./service/trainingProgress.service";
import { TimeTableService } from "./service/time-table.service";
import { TimeTableController } from "./controller/time-table.controller";

@Module({
  imports: [],
  providers: [
    ClassSubjectSessionService,
    ClassSubjectScheduleDetailService,
    TrainingPlanService,
    TimeTableService,
  ],
  controllers: [
    ClassSubjectSessionController,
    ClassSubjectScheduleDetailController,
    TimeTableController,
  ],
  exports: [
    ClassSubjectSessionService,
    ClassSubjectScheduleDetailService,
    TimeTableService,
  ],
})
export class StudyScheduleModule {}
