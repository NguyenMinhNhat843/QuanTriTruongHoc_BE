import { Module } from "@nestjs/common";
import { SemesterService } from "./semester.service";
import { SemesterController } from "./semester.controller";
import { PrismaService } from "../prisma/prisma.service";
import { SemesterQuery } from "./semester.query";

@Module({
  controllers: [SemesterController],
  providers: [SemesterService, PrismaService, SemesterQuery],
  exports: [SemesterService, SemesterQuery],
})
export class SemesterModule {}
