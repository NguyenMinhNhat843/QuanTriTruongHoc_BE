import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CurriculumSubjectQuery {
  constructor(private readonly prisma: PrismaService) {}

  // Lấy môn học theo curriculumId và semesterNumber
  async getSubjectsByCurriculumAndSemester(
    curriculumId: number,
    semesterNumber: number,
  ) {
    return await this.prisma.curriculumSubject.findMany({
      where: {
        curriculumId,
        semesterNumber,
      },
      include: {
        subject: true, // Bao gồm thông tin môn học
      },
    });
  }
}
