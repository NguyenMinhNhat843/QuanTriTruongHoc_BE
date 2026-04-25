import { Module } from "@nestjs/common";
import { MajorService } from "./major.service";
import { MajorController } from "./major.controller";
import { PrismaService } from "../prisma/prisma.service";

@Module({
  controllers: [MajorController],
  providers: [MajorService, PrismaService],
  exports: [MajorService],
})
export class MajorModule {}
