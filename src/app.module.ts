import { Module } from "@nestjs/common";
import { AppController } from "./app.controller.js";
import { UserModule } from "./user/user.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { AppService } from "./app.service.js";
import { ConfigModule } from "@nestjs/config";
import { StudentModule } from "./student/student.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env`,
    }),
    StudentModule,
    PrismaModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
