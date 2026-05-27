import { Module } from "@nestjs/common";
import { CourseOfferController } from "./courseOffer.controller";
import { CourseOfferService } from "./courseOffer.service";
import { CourseRegistrationController } from "./courseRegistration.controller";
import { CourseRegistrationService } from "./CourseRegistration.service";
import { SubjectModule } from "../subject/subject.module";
import { CourseOfferQuery } from "./courseOffer.query";
import { CurriculumSubjectModule } from "../curriculumSubject/curriculumnSubject.module";
import { BatchModule } from "../batch/batch.module";

@Module({
  imports: [SubjectModule, CurriculumSubjectModule, BatchModule],
  controllers: [CourseOfferController, CourseRegistrationController],
  providers: [CourseOfferService, CourseRegistrationService, CourseOfferQuery],
  exports: [CourseOfferService, CourseOfferQuery],
})
export class CourseOfferModule {}
