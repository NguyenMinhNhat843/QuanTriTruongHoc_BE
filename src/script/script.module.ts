import { Module } from "@nestjs/common";
import { GradeImportController } from "./script.controller";
import { GradeImportService } from "./script.service";
import { AdmissionImportController } from "./insert-profile-admission.controller";
import { AdmissionImportService } from "./insert-profile-admission";

@Module({
  imports: [],
  controllers: [GradeImportController, AdmissionImportController],
  providers: [GradeImportService, AdmissionImportService],
})
export class ScriptModule {}
