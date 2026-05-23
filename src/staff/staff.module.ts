import { Module } from "@nestjs/common";
import { StaffService } from "./staff.service.js";
import { StaffController } from "./staff.controller.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { TeacherSubjectController } from "./teacherSubject.controller.js";
import { TeacherSubjectService } from "./teacherSubject.service.js";

@Module({
  imports: [PrismaModule],
  controllers: [StaffController, TeacherSubjectController],
  providers: [StaffService, TeacherSubjectService],
  exports: [StaffService, TeacherSubjectService],
})
export class StaffModule {}
