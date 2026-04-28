import { Module } from "@nestjs/common";
import { UserModule } from "./user/user.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { ConfigModule } from "@nestjs/config";
import { StudentModule } from "./student/student.module.js";
import { StaffModule } from "./staff/staff.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { DepartmentModule } from "./department/department.module.js";
import { MajorModule } from "./major/major.module.js";
import { ClassModule } from "./class/class.module.js";
import { SubjectModule } from "./subject/subject.module.js";
import { SemesterModule } from "./semester/semester.module.js";
import { RoomModule } from "./room/room.module.js";
import { CurriculumModule } from "./curriculumn/curriculum.module.js";
import { CurriculumSubjectModule } from "./curriculumSubject/curriculumnSubject.module.js";
import { BatchModule } from "./batch/batch.module.js";
import { AdmissionModule } from "./admission/admission.module.js";
import { TuitionFeeModule } from "./tuitionFee/tuitionFee.module.js";
import { FeeModule } from "./Fee/fee.module.js";
import { FeeCatalogModule } from "./FeeCatalog/feeCatalog.module.js";
import { CreditPriceModule } from "./creaditPrice/creditPrice.module.js";
import { PostModule } from "./post/post.module.js";
import { ScheduleModule } from "@nestjs/schedule";
import { CourseOfferModule } from "./courseOffer/courseOffer.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env`,
    }),
    ScheduleModule.forRoot(),
    StudentModule,
    PrismaModule,
    UserModule,
    StaffModule,
    AuthModule,
    DepartmentModule,
    MajorModule,
    BatchModule,
    ClassModule,
    SubjectModule,
    SemesterModule,
    RoomModule,
    CurriculumModule,
    CurriculumSubjectModule,
    AdmissionModule,
    TuitionFeeModule,
    FeeModule,
    FeeCatalogModule,
    CreditPriceModule,
    PostModule,
    CourseOfferModule,
  ],
})
export class AppModule {}
