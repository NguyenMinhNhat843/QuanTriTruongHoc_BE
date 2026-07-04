import { Module } from "@nestjs/common";
import { CourseRegisService } from "./courseRegis.service";
import { StudentModule } from "../student/student.module";
import { SemesterModule } from "../semester/semester.module";

@Module({
  imports: [StudentModule, SemesterModule],
  providers: [CourseRegisService],
  controllers: [],
  exports: [CourseRegisService],
})
export class CourseRegisModule {}
