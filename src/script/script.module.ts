import { Module } from "@nestjs/common";
import { GradeImportController } from "./script.controller";
import { GradeImportService } from "./script.service";

@Module({
  imports: [],
  controllers: [GradeImportController],
  providers: [GradeImportService],
})
export class ScriptModule {}
