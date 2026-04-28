import { Module } from "@nestjs/common";
import { StudentService } from "./student.service.js";
import { StudentController } from "./student.controller.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { StudentQuery } from "./student.query.js";

@Module({
  imports: [PrismaModule],
  controllers: [StudentController],
  providers: [StudentService, StudentQuery],
  exports: [StudentService, StudentQuery],
})
export class StudentModule {}
