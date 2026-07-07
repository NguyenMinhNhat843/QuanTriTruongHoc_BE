import { Module } from "@nestjs/common";
import { ClassSubjectController } from "./controller/classSubject.controller";
import { CourseRegistrationController } from "./controller/grades.controller";
import { CourseRegistrationService } from "./service/grades.service";
import { SubjectModule } from "../subject/subject.module";
import { BatchModule } from "../batch/batch.module";
import { ExportGradeTableService } from "./service/exportGrades.service";
import { ClassSubjectService } from "./service/classSubject.service";
import { ClassSubjectGenerateService } from "./service/classSubjectGenerate.service";
import { CourseOfferQuery } from "./service/classSubject.query";

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
