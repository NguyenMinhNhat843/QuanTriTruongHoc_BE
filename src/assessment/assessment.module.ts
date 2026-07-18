import { Module } from "@nestjs/common";
import { AssessmentService } from "./service/assessment.service";
import { AssessmentController } from "./controller/assessment.controller";
import { PrismaService } from "../prisma/prisma.service";
import { ExportExcelService } from "./service/export.service";

@Module({
  controllers: [AssessmentController],
  providers: [AssessmentService, PrismaService, ExportExcelService],
  exports: [AssessmentService],
})
export class AssessmentModule {}
