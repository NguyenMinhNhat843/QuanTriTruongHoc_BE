import { Module } from "@nestjs/common";
import { CurriculumService } from "./curriculum.service";
import { PrismaService } from "../prisma/prisma.service";
import { CurriculumController } from "./curriculumn.controller";
import { CurriculumSubjectModule } from "../curriculumSubject/curriculumnSubject.module";

@Module({
  imports: [CurriculumSubjectModule],
  controllers: [CurriculumController],
  providers: [CurriculumService, PrismaService],
  exports: [CurriculumService],
})
export class CurriculumModule {}
