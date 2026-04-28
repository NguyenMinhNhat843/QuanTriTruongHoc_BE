import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SemesterQuery {
  constructor(private readonly prisma: PrismaService) {}

  // Lấy học kỳ hiện tại
  async getCurrentSemester() {
    const semester = await this.prisma.semester.findFirst({
      where: { isCurrent: true },
    });
    if (!semester) {
      throw new Error("Không tìm thấy học kỳ hiện tại");
    }

    return semester;
  }
}
