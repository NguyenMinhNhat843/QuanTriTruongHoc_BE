import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module"; // Hoặc đường dẫn phù hợp với dự án của bạn
import { TrainingProgressService } from "./training-progress.service";

@Module({
  imports: [PrismaModule], // Khai báo nếu PrismaService được export từ PrismaModule riêng biệt
  controllers: [TrainingProgressService],
  providers: [TrainingProgressService],
  exports: [TrainingProgressService], // Export nếu các module khác cần dùng đến logic này
})
export class TrainingProgressModule {}
