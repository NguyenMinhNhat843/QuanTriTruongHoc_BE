import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module.js";
import { UserService } from "./user.service.js";
import { UserController } from "./user.controller.js";

@Module({
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
