import { Module } from "@nestjs/common";
import { StaffController } from "./controller/staff.controller.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { TeacherSubjectController } from "./controller/teacherSubject.controller.js";
import { StaffService } from "./service/staff.service.js";
import { TeacherSubjectService } from "./service/teacherSubject.service.js";
import { TeachingLevelController } from "./controller/teaching-level.controller.js";
import { TeachingLevelService } from "./service/teaching-level.service.js";

@Module({
  imports: [PrismaModule],
  controllers: [StaffController, TeacherSubjectController, TeachingLevelController],
  providers: [StaffService, TeacherSubjectService, TeachingLevelService],
  exports: [StaffService, TeacherSubjectService, TeachingLevelService],
})
export class StaffModule {}
