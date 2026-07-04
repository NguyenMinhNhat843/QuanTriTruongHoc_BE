import { Module } from "@nestjs/common";
import { ClassSubjectController } from "./controller/classSubject.controller";
import { CourseRegistrationController } from "./grades.controller";
import { CourseRegistrationService } from "./grades.service";
import { SubjectModule } from "../subject/subject.module";
import { CourseOfferQuery } from "./classSubject.query";
import { BatchModule } from "../batch/batch.module";
import { ExportGradeTableService } from "./exportGrades.service";
import { ClassSubjectGenerateService } from "./classSubjectGenerate.service";
import { ClassSubjectService } from "./service/classSubject.service";

@Module({
  imports: [SubjectModule, BatchModule, SubjectModule],
  controllers: [ClassSubjectController, CourseRegistrationController],
  providers: [
    ClassSubjectService,
    CourseRegistrationService,
    CourseOfferQuery,
    ExportGradeTableService,
    ClassSubjectGenerateService,
  ],
  exports: [
    ClassSubjectService,
    CourseOfferQuery,
    ExportGradeTableService,
    ClassSubjectGenerateService,
  ],
})
export class CourseOfferModule {}
