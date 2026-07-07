import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AdmissionProfileController } from "./admission-profile.controller";
import { AdmissionProfileService } from "./admission-profile.service";

@Module({
  imports: [PrismaModule],
  controllers: [AdmissionProfileController],
  providers: [AdmissionProfileService],
  exports: [AdmissionProfileService],
})
export class AdmissionProfileModule {}
