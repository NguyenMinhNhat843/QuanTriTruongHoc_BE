import { Module } from "@nestjs/common";
import { AssessmentService } from "./service/assessment.service";
import { AssessmentController } from "./controller/assessment.controller";
import { PrismaService } from "../prisma/prisma.service";

@Module({
  controllers: [AssessmentController],
  providers: [AssessmentService, PrismaService],
  exports: [AssessmentService],
})
export class AssessmentModule {}
