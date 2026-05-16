import { Module } from "@nestjs/common";
import { GradeComponentController } from "./grade.controller";
import { GradeComponentService } from "./grade.service";
import { GradeEntryService } from "./gradeEntry.service";
import { GradeEntryController } from "./gradeEntry.controller";
import { GradeSubjectService } from "./gradeSubject.service";

@Module({
  controllers: [GradeComponentController, GradeEntryController],
  providers: [GradeComponentService, GradeEntryService, GradeSubjectService],
  exports: [GradeComponentService, GradeEntryService, GradeSubjectService],
})
export class GradeComponentModule {}
