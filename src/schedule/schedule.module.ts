import { Module } from "@nestjs/common";
import { BatchModule } from "../batch/batch.module";
import { BatchService } from "../batch/batch.service";

@Module({
  imports: [BatchModule],
  providers: [BatchService],
  controllers: [],
  exports: [],
})
export class ScheduleModule {}
