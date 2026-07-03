import { Module } from "@nestjs/common";
import { ClassSubjectSessionController } from "./controller/classSubjectSession.controller";
import { ClassSubjectScheduleDetailController } from "./controller/classSubjectScheduleDetail.controller";
import { ClassSubjectScheduleDetailService } from "./service/classSubjectScheduleDetail.service";
import { ClassSubjectSessionService } from "./service/classSubjectSession.service";
import { TrainingPlanService } from "./service/trainingProgress.service";

@Module({
  imports: [],
  providers: [
    ClassSubjectSessionService,
    ClassSubjectScheduleDetailService,
    TrainingPlanService,
  ],
  controllers: [
    ClassSubjectSessionController,
    ClassSubjectScheduleDetailController,
  ],
  exports: [ClassSubjectSessionService, ClassSubjectScheduleDetailService],
})
export class StudyScheduleModule {}
