import { Module } from "@nestjs/common";
import { AcademicYearController } from "./academic-year.controller";
import { AcademicYearService } from "./academic-year.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [AcademicYearController],
  providers: [AcademicYearService],
  exports: [AcademicYearService],
})
export class AcademicYearModule {}
