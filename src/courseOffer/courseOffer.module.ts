import { Module } from "@nestjs/common";
import { CourseOfferController } from "./courseOffer.controller";
import { CourseOfferService } from "./courseOffer.service";
import { CourseRegistrationController } from "./courseRegistration.controller";
import { CourseRegistrationService } from "./CourseRegistration.service";

@Module({
  controllers: [CourseOfferController, CourseRegistrationController],
  providers: [CourseOfferService, CourseRegistrationService],
  exports: [CourseOfferService], // Nếu bạn muốn sử dụng CourseOfferService ở module khác
})
export class CourseOfferModule {}
