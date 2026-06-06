import { Module } from "@nestjs/common";
import { ClassSubjectController } from "./classSubject.controller";
import { ClassSubjectService } from "./classSubject.service";
import { CourseRegistrationController } from "./grades.controller";
import { CourseRegistrationService } from "./grades.service";
import { SubjectModule } from "../subject/subject.module";
import { CourseOfferQuery } from "./classSubject.query";
import { CurriculumSubjectModule } from "../curriculumSubject/curriculumnSubject.module";
import { BatchModule } from "../batch/batch.module";
import { ExportGradeTableService } from "./exportGrades.service";
import { ClassSubjectGenerateService } from "./classSubjectGenerate.service";

@Module({
  imports: [SubjectModule, CurriculumSubjectModule, BatchModule],
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
