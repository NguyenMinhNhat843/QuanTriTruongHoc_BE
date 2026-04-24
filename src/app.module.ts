import { Module } from "@nestjs/common";
import { AppController } from "./app.controller.js";
import { UserModule } from "./user/user.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { AppService } from "./app.service.js";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [
    PrismaModule,
    UserModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env`,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
