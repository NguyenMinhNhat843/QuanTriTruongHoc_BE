import { Module } from "@nestjs/common";
import { StaffController } from "./controller/staff.controller.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { TeacherSubjectController } from "./controller/teacherSubject.controller.js";
import { StaffService } from "./service/staff.service.js";
import { TeacherSubjectService } from "./service/teacherSubject.service.js";
import { TeachingQuotaController } from "./controller/teaching-quota.controller.js";
import { TeachingQuotaService } from "./service/teaching-quota.service.js";
import { StaffPositionController } from "./controller/staff-position.controller.js";
import { StaffPositionService } from "./service/staff-position.service.js";
import { ManagementPositionController } from "./controller/manager-position.controller.js";
import { ManagementPositionService } from "./service/manager-position.service.js";

@Module({
  imports: [PrismaModule],
  controllers: [
    StaffController,
    TeacherSubjectController,
    TeachingQuotaController,
    StaffPositionController,
    ManagementPositionController,
  ],
  providers: [
    StaffService,
    TeacherSubjectService,
    TeachingQuotaService,
    StaffPositionService,
    ManagementPositionService,
  ],
  exports: [StaffService, TeacherSubjectService, TeachingQuotaService, StaffPositionService, ManagementPositionService],
})
export class StaffModule {}
