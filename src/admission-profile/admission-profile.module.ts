import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AdmissionProfileController } from "./admission-profile.controller";
import { AdmissionProfileService } from "./admission-profile.service";

@Module({
  imports: [PrismaModule], // Import PrismaModule để AdmissionProfileService có thể dùng được PrismaService
  controllers: [AdmissionProfileController],
  providers: [AdmissionProfileService],
  exports: [AdmissionProfileService], // Export nếu các module khác cần sử dụng service này
})
export class AdmissionProfileModule {}
