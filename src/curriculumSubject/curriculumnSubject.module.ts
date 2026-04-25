import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CurriculumSubjectService } from "./curriculumnSubject.service";

@Module({
  providers: [CurriculumSubjectService, PrismaService],
  exports: [CurriculumSubjectService],
})
export class CurriculumSubjectModule {}
