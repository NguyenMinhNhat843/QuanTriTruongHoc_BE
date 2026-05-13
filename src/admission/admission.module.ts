import { Module } from "@nestjs/common";
import { AdmissionService } from "./admission.service";
import { AdmissionController } from "./admission.controller";
import { PrismaModule } from "../prisma/prisma.module"; // Đường dẫn tới PrismaModule của bạn
import { CriterionController } from "./criteria.controller";
import { CriterionService } from "./criteria.service";

@Module({
  imports: [PrismaModule],
  controllers: [AdmissionController, CriterionController],
  providers: [AdmissionService, CriterionService],
  exports: [AdmissionService, CriterionService], // Export nếu các module khác (như Application) cần dùng
})
export class AdmissionModule {}
