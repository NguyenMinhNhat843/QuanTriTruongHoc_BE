import { Module } from "@nestjs/common";
import { ClassService } from "./class.service";
import { ClassController } from "./class.controller";
import { PrismaService } from "../prisma/prisma.service";
import { ClassBusinessService } from "./class.business";

@Module({
  controllers: [ClassController],
  providers: [ClassService, PrismaService, ClassBusinessService],
  exports: [ClassService, ClassBusinessService],
})
export class ClassModule {}
