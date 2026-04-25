import { Module } from "@nestjs/common";
import { UserModule } from "./user/user.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { ConfigModule } from "@nestjs/config";
import { StudentModule } from "./student/student.module.js";
import { StaffModule } from "./staff/staff.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { DepartmentModule } from "./department/department.module.js";
import { MajorModule } from "./major/major.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env`,
    }),
    StudentModule,
    PrismaModule,
    UserModule,
    StaffModule,
    AuthModule,
    DepartmentModule,
    MajorModule,
  ],
})
export class AppModule {}
