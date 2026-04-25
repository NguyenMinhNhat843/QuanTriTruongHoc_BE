import { Module } from "@nestjs/common";
import { SemesterService } from "./semester.service";
import { SemesterController } from "./semester.controller";
import { PrismaService } from "../prisma/prisma.service";

@Module({
  controllers: [SemesterController],
  providers: [SemesterService, PrismaService],
  exports: [SemesterService],
})
export class SemesterModule {}
