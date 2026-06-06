import { Module } from "@nestjs/common";
import { CourseOfferController } from "./classSubject.controller";
import { CourseOfferService } from "./classSubject.service";
import { CourseRegistrationController } from "./grades.controller";
import { CourseRegistrationService } from "./grades.service";
import { SubjectModule } from "../subject/subject.module";
import { CourseOfferQuery } from "./classSubject.query";
import { CurriculumSubjectModule } from "../curriculumSubject/curriculumnSubject.module";
import { BatchModule } from "../batch/batch.module";
import { ExportGradeTableService } from "./exportGrades.service";
import { CourseOfferGenerateService } from "./classSubjectGenerate.service";

@Module({
  imports: [SubjectModule, CurriculumSubjectModule, BatchModule],
  controllers: [CourseOfferController, CourseRegistrationController],
  providers: [
    CourseOfferService,
    CourseRegistrationService,
    CourseOfferQuery,
    ExportGradeTableService,
    CourseOfferGenerateService,
  ],
  exports: [
    CourseOfferService,
    CourseOfferQuery,
    ExportGradeTableService,
    CourseOfferGenerateService,
  ],
})
export class CourseOfferModule {}
