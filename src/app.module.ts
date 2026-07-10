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
import { BatchModule } from "./batch/batch.module.js";
import { PostModule } from "./post/post.module.js";
import { ScheduleModule } from "@nestjs/schedule";
import { CourseOfferModule } from "./courseOffer/classSubject.module.js";
import { StudyScheduleModule } from "./schedule/studySchedule.module.js";
import { CloudinaryModule } from "./upload/upload.module.js";
import { DocumentProfileModule } from "./documentProfile/documentProfile.module.js";
import { AdmissionProfileModule } from "./admission-profile/admission-profile.module.js";
import { AssessmentModule } from "./assessment/assessment.module.js";
import { AnalyticsModule } from "./analytic/analytic.module.js";
import { TuitionModule } from "./tuition/tuition.module.js";
import { AddressModule } from "./address/address.module.js";

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
    StudyScheduleModule,
    PostModule,
    CourseOfferModule,
    CloudinaryModule,
    DocumentProfileModule,
    AdmissionProfileModule,
    AssessmentModule,
    AnalyticsModule,
    TuitionModule,
    AddressModule,
  ],
})
export class AppModule {}
