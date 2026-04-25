import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CurriculumSubjectController } from "./curriculumnSubject.controller";
import { CurriculumSubjectService } from "./curriculumnSubject.service";

@Module({
  controllers: [CurriculumSubjectController],
  providers: [CurriculumSubjectService, PrismaService],
  exports: [CurriculumSubjectService],
})
export class CurriculumSubjectModule {}
