import { forwardRef, Module } from "@nestjs/common";
import { BatchService } from "./batch.service";
import { BatchController } from "./batch.controller";
import { PrismaModule } from "../prisma/prisma.module"; // Đảm bảo bạn đã có PrismaModule
import { CurriculumModule } from "../curriculumn/curriculum.module";
import { SemesterModule } from "../semester/semester.module";

@Module({
  imports: [PrismaModule, CurriculumModule, forwardRef(() => SemesterModule)],
  controllers: [BatchController],
  providers: [BatchService],
  exports: [BatchService],
})
export class BatchModule {}
