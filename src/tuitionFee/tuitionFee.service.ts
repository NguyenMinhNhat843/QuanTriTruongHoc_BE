import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TuitionFeeService {
  constructor(private readonly prisma: PrismaService) {}

  // Học sinh lần đầu đóng sẽ gọi api này
  async processInitialEnrollmentPayment(studentId: number) {
    // 1. Lấy Student: học sinh này đã chốt hồ sơ và bắt đầu đóng tiền HK1
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        batch: true,
      },
    });

    // 2. Lấy chương trình khung
    const curriculum = await this.prisma.batch.findFirst({
      where: {
        id: student?.batch?.id,
      },
      include: {
        curriculum: {
          include: {
            curriculumSubjects: {
              where: {
                semesterNumber: 1,
              },
              include: {
                subject: true,
              },
            },
          },
        },
      },
    });

    // 3. Lấy các môn học học kỳ 1
    const subjects = curriculum?.curriculum?.curriculumSubjects.map(
      (cs) => cs.subject,
    );

    // 4. Tính tổng học phí của các môn học này
    const totalTuitionFee = subjects?.reduce((total, subject) => {
      return total + subject.credits * 70000;
    }, 0);

    return curriculum;
  }
}
