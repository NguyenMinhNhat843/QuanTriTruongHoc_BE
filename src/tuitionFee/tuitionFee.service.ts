import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EnrollmentPaymentDto } from "./tuitionFee.dto";

@Injectable()
export class TuitionFeeService {
  constructor(private readonly prisma: PrismaService) {}

  // Học sinh lần đầu đóng sẽ gọi api này
  async getInitialEnrollmentFees(data: EnrollmentPaymentDto) {
    // 1. Lấy Student: học sinh này đã chốt hồ sơ và bắt đầu đóng tiền HK1
    const student = await this.prisma.student.findUnique({
      where: { studentCode: data.studentCode },
      include: {
        batch: {
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
        },
      },
    });

    if (!student) {
      throw new NotFoundException("Không tìm thấy sinh viên");
    }

    // 2. Lấy danh sách môn HK1
    const subjects =
      student.batch?.curriculum?.curriculumSubjects.map((cs) => cs.subject) ||
      [];

    if (subjects.length === 0) {
      throw new BadRequestException("Chưa cấu hình môn học kỳ 1");
    }

    // 3. Lấy giá tín chỉ (có fallback)
    const prices = await this.prisma.creditPrice.findMany({
      where: {
        semester: 1,
        OR: [
          { isGlobal: true },
          { majorId: student.majorId },
          { batchId: student.batchId },
          {
            AND: [{ majorId: student.majorId }, { batchId: student.batchId }],
          },
        ],
      },
    });

    const getPriority = (p: any) => {
      if (p.majorId && p.batchId) return 4;
      if (p.batchId) return 3;
      if (p.majorId) return 2;
      if (p.isGlobal) return 1;
      return 0;
    };

    const bestPrice = prices.sort((a, b) => getPriority(b) - getPriority(a))[0];

    if (!bestPrice || bestPrice.price <= 0) {
      throw new BadRequestException(
        "Chưa cấu hình giá tín chỉ cho sinh viên này",
      );
    }

    // 4. Tính học phí môn
    const subjectFees = subjects.map((subject) => ({
      type: "SUBJECT",
      name: subject.subjectName,
      credits: subject.credits,
      amount: subject.credits * bestPrice.price,
    }));

    // 5. Lấy phí khác (FIX LOGIC)
    const feeCatalogs = await this.prisma.feeCatalog.findMany({
      where: {
        OR: [
          { isGlobal: true },
          { majorId: student.majorId },
          { batchId: student.batchId },
          {
            AND: [{ majorId: student.majorId }, { batchId: student.batchId }],
          },
        ],
      },
      include: {
        fee: true, // nếu bạn có bảng Fee
      },
    });

    const otherFees = feeCatalogs.map((f) => ({
      type: "FEE",
      name: f.fee?.name || "Khác",
      amount: f.amount,
    }));

    // 6. Gộp lại
    const allFees = [...subjectFees, ...otherFees];

    const total = allFees.reduce((sum, item) => sum + item.amount, 0);

    // 7. Response chuẩn cho FE
    return {
      studentCode: student.studentCode,
      semester: 1,

      breakdown: allFees,

      summary: {
        subjectTotal: subjectFees.reduce((s, i) => s + i.amount, 0),
        otherFeeTotal: otherFees.reduce((s, i) => s + i.amount, 0),
        total,
      },
    };
  }
}
