import { Module } from "@nestjs/common";
import { AssessmentService } from "./assessment.service";
import { AssessmentController } from "./assessment.controller";
import { PrismaService } from "../prisma/prisma.service";

@Module({
  controllers: [AssessmentController],
  providers: [AssessmentService, PrismaService],
  exports: [AssessmentService],
})
export class AssessmentModule {}
