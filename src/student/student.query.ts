import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class StudentQuery {
  private readonly prisma: PrismaService;

  // Get Student with Batch and Curriculum
  async getStudentWithBatchAndCurriculum(studentId: number) {
    const result = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        batch: {
          include: {
            curriculum: true,
          },
        },
      },
    });

    if (!result) {
      throw new Error(`Không tìm thấy sinh viên với ID ${studentId}`);
    }

    return result;
  }
}
