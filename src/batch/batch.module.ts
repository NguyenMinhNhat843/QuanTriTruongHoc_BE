import { Module } from "@nestjs/common";
import { BatchService } from "./batch.service";
import { BatchController } from "./batch.controller";
import { PrismaModule } from "../prisma/prisma.module"; // Đảm bảo bạn đã có PrismaModule

@Module({
  imports: [PrismaModule],
  controllers: [BatchController],
  providers: [BatchService],
  exports: [BatchService], // Export nếu các module khác (như Class) cần dùng BatchService
})
export class BatchModule {}
