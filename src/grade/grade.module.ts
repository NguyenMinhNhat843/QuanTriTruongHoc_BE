import { Module } from "@nestjs/common";
import { GradeComponentController } from "./grade.controller";
import { GradeComponentService } from "./grade.service";

@Module({
  controllers: [GradeComponentController],
  providers: [GradeComponentService],
  // Nếu PrismaModule của bạn chưa cấu hình @Global(), hãy un-comment dòng imports phía dưới:
  // imports: [PrismaModule],
})
export class GradeComponentModule {}
