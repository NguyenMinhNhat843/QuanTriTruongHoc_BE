import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateStudyScheduleDto } from "./studySchedule.dto";

@Injectable()
export class ScheduleService {
  constructor(private prisma: PrismaService) {}

  /**
   * Hàm tạo lịch học cho 1 lớp, 1 học kỳ
   */
  async generateScheduleForAClass(data: CreateStudyScheduleDto[]) {
    await this.prisma.classSubjectSchedule.createMany({
      data,
    });

    return {
      message: "Tạo tiến độ đào tạo thành công",
    };
  }
}
