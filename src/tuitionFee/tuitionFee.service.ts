import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StudentStatus } from "../../prisma/generated/prisma/enums";
import { PayTuitionFeeDto } from "./tuitionFee.dto";

@Injectable()
export class TuitionFeeService {
  constructor(private readonly prisma: PrismaService) {}

  // api lên đợt đóng học phí cho học kỳ
  async createTuitionFees() {
    // 1. Quét danh sách sinh viên ENROLLED
    const students = await this.prisma.student.findMany({
      where: { status: StudentStatus.enrolled },
      include: {
        batch: {
          include: {
            curriculum: {
              include: {
                curriculumSubjects: {
                  where: { semesterNumber: 1 },
                  include: { subject: true },
                },
              },
            },
          },
        },
      },
    });

    if (!students || students.length === 0) {
      throw new NotFoundException(
        "Không tìm thấy sinh viên nào cần lập học phí",
      );
    }

    const results: { studentCode: string; itemCount: number; total: number }[] =
      [];

    // Sử dụng Transaction để đảm bảo nếu lỗi một em thì không bị rác data (hoặc tùy mục đích của bạn)
    return await this.prisma.$transaction(async (tx) => {
      for (const student of students) {
        // 2. Lấy danh sách môn HK1 của từng sinh viên
        const subjects =
          student.batch?.curriculum?.curriculumSubjects.map(
            (cs) => cs.subject,
          ) || [];

        if (subjects.length === 0) continue; // Bỏ qua nếu chưa cấu hình môn

        const prices = await tx.creditPrice.findMany({
          where: {
            OR: [
              { isGlobal: true }, // Giá áp dụng toàn cầu (thường không quan tâm kỳ nào)
              {
                semester: 1,
                majorId: student.majorId,
              }, // Giá riêng cho ngành + kỳ này
              {
                semester: 1,
                batchId: student.batchId,
              }, // Giá riêng cho khóa + kỳ này
              {
                majorId: student.majorId,
                batchId: student.batchId,
                // Có thể thêm cả 3 điều kiện kết hợp nếu muốn độ ưu tiên cao nhất
              },
            ],
          },
          // Sắp xếp để lấy cái "chi tiết nhất" lên đầu nếu cần
          orderBy: [
            { majorId: "desc" },
            { batchId: "desc" },
            { semester: "desc" },
          ],
        });

        const getPriority = (p: any) => {
          if (p.majorId && p.batchId) return 4;
          if (p.batchId) return 3;
          if (p.majorId) return 2;
          if (p.isGlobal) return 1;
          return 0;
        };

        const bestPrice = prices.sort(
          (a, b) => getPriority(b) - getPriority(a),
        )[0];

        if (!bestPrice || bestPrice.price <= 0) continue;

        // 4. Lấy phí khác (Bảo hiểm, đồng phục...) cho sinh viên này
        const feeCatalogs = await tx.feeCatalog.findMany({
          where: {
            OR: [
              { isGlobal: true },
              { majorId: student.majorId },
              { batchId: student.batchId },
            ],
          },
          include: { fee: true },
        });

        // 5. Gom tất cả các mục thu
        const subjectItems = subjects.map((sub) => ({
          studentId: student.id,
          name: `Học phí môn: ${sub.subjectName}`,
          amount: sub.credits * bestPrice.price,
          status: "unpaid",
        }));

        const otherItems = feeCatalogs.map((fc) => ({
          studentId: student.id,
          name: fc.fee?.name || "Lệ phí khác",
          amount: fc.amount,
          status: "unpaid",
        }));

        const allItems = [...subjectItems, ...otherItems];

        // 6. Lưu vào DB
        if (allItems.length > 0) {
          await tx.feeInvoiceItem.createMany({
            data: allItems,
          });

          results.push({
            studentCode: student.studentCode,
            itemCount: allItems.length,
            total: allItems.reduce((sum, i) => sum + i.amount, 0),
          });
        }
      }

      return {
        message: `Đã tạo thành công danh mục học phí cho ${results.length} sinh viên`,
        details: results,
      };
    });
  }

  // api lấy danh sách các khoản phí của sinh viên
  async getTuitionFees(studentId: number) {
    const fees = await this.prisma.feeInvoiceItem.findMany({
      where: {
        studentId: studentId,
      },
    });

    return fees;
  }

  // Thanh toán học phí
  async payTuitionFee(data: PayTuitionFeeDto) {
    const { studentId, itemsPaymented, semesterId } = data;
    const items = await this.prisma.feeInvoiceItem.findMany({
      where: {
        id: { in: itemsPaymented },
        studentId: studentId,
        status: "unpaid",
      },
    });

    if (items.length === 0) {
      throw new NotFoundException("Không tìm thấy khoản phí nào để thanh toán");
    }

    // cập nhật status các item đó là paymented
    await this.prisma.feeInvoiceItem.updateMany({
      where: {
        id: { in: itemsPaymented },
        studentId: studentId,
      },
      data: {
        status: "paid",
      },
    });

    // tạo hoa đơn thanh toán
    const invoice = await this.prisma.feeInvoice.create({
      data: {
        studentId: studentId,
        totalAmount: items.reduce((sum, i) => sum + i.amount, 0),
        semesterId: semesterId,
      },
    });

    return invoice;
  }
}
