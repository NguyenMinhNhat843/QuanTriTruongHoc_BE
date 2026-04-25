import { Module } from "@nestjs/common";
import { CurriculumService } from "./curriculum.service";
import { PrismaService } from "../prisma/prisma.service";
import { CurriculumController } from "./curriculumn.controller";

@Module({
  controllers: [CurriculumController],
  providers: [CurriculumService, PrismaService],
  exports: [CurriculumService],
})
export class CurriculumModule {}
