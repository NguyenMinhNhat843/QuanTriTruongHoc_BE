import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CurriculumSubjectService } from "./curriculumnSubject.service";
import { CurriculumSubjectQuery } from "./curriculumSubject.query";

@Module({
  providers: [CurriculumSubjectService, PrismaService, CurriculumSubjectQuery],
  exports: [CurriculumSubjectService, CurriculumSubjectQuery],
})
export class CurriculumSubjectModule {}
