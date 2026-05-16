import { Module } from "@nestjs/common";
import { SubjectService } from "./subject.service";
import { SubjectController } from "./subject.controller";
import { PrismaService } from "../prisma/prisma.service";
import { GradeComponentModule } from "../grade/grade.module";

@Module({
  imports: [GradeComponentModule],
  controllers: [SubjectController],
  providers: [SubjectService, PrismaService],
  exports: [SubjectService],
})
export class SubjectModule {}
