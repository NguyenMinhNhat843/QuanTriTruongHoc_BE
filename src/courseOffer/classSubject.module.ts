import { Module } from "@nestjs/common";
import { ClassSubjectController } from "./controller/classSubject.controller";
import { GradeController } from "./controller/grades.controller";
import { SubjectModule } from "../subject/subject.module";
import { BatchModule } from "../batch/batch.module";
import { ExportGradeTableService } from "./service/exportGrades.service";
import { ClassSubjectService } from "./service/classSubject.service";
import { ClassSubjectGenerateService } from "./service/classSubjectGenerate.service";
import { ClassSubjectQuery } from "./service/classSubject.query";
import { ExportGradeTableController } from "./controller/export.controller";
import { ExportGradeTableSummaryService } from "./service/exportGradeSummary.service";
import { GradeService } from "./service/grades.service";

@Module({
  imports: [SubjectModule, BatchModule, SubjectModule],
  controllers: [
    ClassSubjectController,
    GradeController,
    ExportGradeTableController,
  ],
  providers: [
    ClassSubjectService,
    ClassSubjectQuery,
    ExportGradeTableService,
    ClassSubjectGenerateService,
    ExportGradeTableSummaryService,
    GradeService,
  ],
  exports: [
    ClassSubjectService,
    ClassSubjectQuery,
    ExportGradeTableService,
    ClassSubjectGenerateService,
    GradeService,
  ],
})
export class CourseOfferModule {}
