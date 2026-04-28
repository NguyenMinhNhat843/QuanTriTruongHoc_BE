import { Module } from "@nestjs/common";
import { CourseOfferController } from "./courseOffer.controller";
import { CourseOfferService } from "./courseOffer.service";

@Module({
  controllers: [CourseOfferController],
  providers: [CourseOfferService],
  exports: [CourseOfferService], // Nếu bạn muốn sử dụng CourseOfferService ở module khác
})
export class CourseOfferModule {}
