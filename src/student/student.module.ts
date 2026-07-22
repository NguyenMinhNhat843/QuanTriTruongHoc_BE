import { Module, forwardRef } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module.js";
import { AdmissionModule } from "../admission/admission.module.js";
import { StudentController } from "./controllers/student.controller.js";
import { StudentService } from "./services/student.service.js";
import { StudentQuery } from "./student.query.js";

@Module({
  imports: [PrismaModule, forwardRef(() => AdmissionModule)],
  controllers: [StudentController],
  providers: [StudentService, StudentQuery],
  exports: [StudentService, StudentQuery],
})
export class StudentModule {}
