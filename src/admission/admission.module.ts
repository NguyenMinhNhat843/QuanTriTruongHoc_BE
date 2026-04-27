import { Module } from "@nestjs/common";
import { AdmissionService } from "./admission.service";
import { AdmissionController } from "./admission.controller";
import { PrismaModule } from "../prisma/prisma.module"; // Đường dẫn tới PrismaModule của bạn

@Module({
  imports: [PrismaModule],
  controllers: [AdmissionController],
  providers: [AdmissionService],
  exports: [AdmissionService], // Export nếu các module khác (như Application) cần dùng
})
export class AdmissionModule {}
