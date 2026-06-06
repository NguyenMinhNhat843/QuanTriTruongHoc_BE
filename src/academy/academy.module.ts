import { Module } from "@nestjs/common";
import { ClassModule } from "../class/class.module";
import { SemesterModule } from "../semester/semester.module";
import { BatchModule } from "../batch/batch.module";
import { CourseOfferModule } from "../courseOffer/classSubject.module";
import { StaffModule } from "../staff/staff.module";
import { AcademyController } from "./academy.controller";
import { AcademyService } from "./academy.service";

@Module({
  imports: [
    ClassModule,
    SemesterModule,
    BatchModule,
    CourseOfferModule,
    StaffModule,
  ],
  controllers: [AcademyController],
  providers: [AcademyService],
})
export class AcademyModule {}
