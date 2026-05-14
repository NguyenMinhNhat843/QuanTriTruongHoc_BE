import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RoleType, StudentStatus } from "../../prisma/generated/prisma/enums";
import { PayTuitionFeeDto, SearchTuitionDto } from "./tuitionFee.dto";
import {
  FeeInvoiceItemStatus,
  InvoiceDto,
  TuitionFeeItemsDto,
  TuitionPreviewResponseDto,
} from "./tuitionFee.response";
import * as bcrypt from "bcryptjs";
import { generateId } from "../utils/generateId";

@Injectable()
export class TuitionFeeService {
  constructor(private readonly prisma: PrismaService) {}

  async deleteAll() {
    await this.prisma.feeInvoiceItem.deleteMany({});
    await this.prisma.feeInvoice.deleteMany({});
  }

  // api xem trước thông số mở đợt học phí
  // Ví dụ mở học phí HK1-2026 sẽ hiện bao nhiêu sinh viên, tổng tiền ước tính
  async previewTuitionFees(): Promise<TuitionPreviewResponseDto> {
    // 1. Lấy học kỳ hiện tại để biết đang preview cho kỳ nào
    const semesterCurrent = await this.prisma.semester.findFirst({
      where: { isCurrent: true },
    });

    if (!semesterCurrent) {
      throw new BadRequestException("Chưa thiết lập học kỳ hiện tại.");
    }

    // 2. Lấy danh sách sinh viên và các môn học họ sẽ phải học trong kỳ này (ví dụ SemesterNumber: 1)
    const students = await this.prisma.student.findMany({
      where: { status: StudentStatus.approved },
      include: {
        batch: {
          include: {
            curriculum: {
              include: {
                curriculumSubjects: {
                  where: { semesterNumber: 1 }, // Giả sử kỳ đầu tiên
                  include: { subject: true },
                },
              },
            },
            major: true,
          },
        },
      },
    });

    const totalStudents = students.length;
    let totalCredits = 0;
    let estimatedTotalAmount = 0;

    // 3. Tính toán giả lập
    for (const student of students) {
      const subjects = student.batch?.curriculum?.curriculumSubjects || [];

      // Tính tổng tín chỉ của sinh viên này
      const studentCredits = subjects.reduce(
        (sum, cs) => sum + (cs.subject?.credits || 0),
        0,
      );
      totalCredits += studentCredits;

      // Lấy giá tín chỉ ưu tiên cao nhất cho sinh viên này (giống logic hàm create)
      const prices = await this.prisma.creditPrice.findMany({
        where: {
          OR: [
            { isGlobal: true },
            { majorId: student.batch?.majorId },
            { batchId: student.batchId },
          ],
        },
        orderBy: [
          { batchId: "desc" }, // Ưu tiên giá theo khóa trước
          { majorId: "desc" },
        ],
        take: 1,
      });

      const bestPrice = prices[0]?.price || 0;

      // Lấy các khoản lệ phí cố định
      const fees = await this.prisma.feeCatalog.findMany({
        where: {
          OR: [{ isGlobal: true }, { batchId: student.batchId }],
        },
      });

      const studentFeesAmount = fees.reduce((sum, f) => sum + f.amount, 0);

      // Tổng tiền dự kiến của 1 sinh viên
      estimatedTotalAmount += studentCredits * bestPrice + studentFeesAmount;
    }

    // 4. Trả về kết quả preview
    return {
      semesterName: semesterCurrent.name,
      totalStudents,
      totalCredits,
      estimatedTotalAmount,
      averagePerStudent:
        totalStudents > 0 ? estimatedTotalAmount / totalStudents : 0,
      generatedAt: new Date(),
    };
  }

  // api lên đợt đóng học phí cho học kỳ hiện tại
  async createTuitionFees() {
    // 1. Lấy dữ liệu chung trước khi vào vòng lặp để tránh query lặp lại
    const [students, semesterCurrent] = await Promise.all([
      this.prisma.student.findMany({
        where: { status: StudentStatus.approved },
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
      }),
      this.prisma.semester.findFirst({ where: { isCurrent: true } }),
    ]);

    if (!students?.length)
      throw new NotFoundException("Không tìm thấy sinh viên cần lập học phí");

    // Đảm bảo semesterId không bị null (Sửa lỗi bạn gặp phải)
    if (!semesterCurrent)
      throw new BadRequestException(
        "Vui lòng thiết lập học kỳ hiện tại trước khi tạo học phí",
      );

    const results: { studentCode: string; itemCount: number; total: number }[] =
      [];

    return await this.prisma.$transaction(async (tx) => {
      for (const student of students) {
        const subjects =
          student.batch?.curriculum?.curriculumSubjects.map(
            (cs) => cs.subject,
          ) || [];
        if (!subjects.length) continue;

        // 2. Lấy giá và phí khác (Dùng Promise.all để chạy song song)
        const [prices, feeCatalogs] = await Promise.all([
          tx.creditPrice.findMany({
            where: {
              OR: [
                { isGlobal: true },
                { semester: 1 },
                { batchId: student.batchId },
              ],
            },
            orderBy: [
              { majorId: "desc" },
              { batchId: "desc" },
              { semester: "desc" },
            ],
          }),
          tx.feeCatalog.findMany({
            where: { OR: [{ isGlobal: true }, { batchId: student.batchId }] },
            include: { fee: true },
          }),
        ]);

        // 3. Logic chọn giá ưu tiên nhất (Rút gọn)
        const bestPrice = prices.sort((a, b) => {
          const getP = (p: any) =>
            p.majorId && p.batchId
              ? 4
              : p.batchId
                ? 3
                : p.majorId
                  ? 2
                  : p.isGlobal
                    ? 1
                    : 0;
          return getP(b) - getP(a);
        })[0];

        if (!bestPrice || bestPrice.price <= 0) continue;

        // 4. Gom dữ liệu và tạo invoice items
        const allItems = [
          ...subjects.map((sub) => ({
            studentId: student.id,
            name: `Học phí môn: ${sub.subjectName}`,
            amount: sub.credits * bestPrice.price,
            status: FeeInvoiceItemStatus.UNPAID,
            semesterId: semesterCurrent.id, // Luôn có giá trị nhờ kiểm tra ở trên
          })),
          ...feeCatalogs.map((fc) => ({
            studentId: student.id,
            name: fc.fee?.name || "Lệ phí khác",
            amount: fc.amount,
            status: FeeInvoiceItemStatus.UNPAID,
            semesterId: semesterCurrent.id,
          })),
        ];

        if (allItems.length > 0) {
          await tx.feeInvoiceItem.createMany({ data: allItems });
          results.push({
            studentCode: student.studentCode,
            itemCount: allItems.length,
            total: allItems.reduce((sum, i) => sum + i.amount, 0),
          });
        }
      }
      return {
        message: `Thành công cho ${results.length} sinh viên`,
        semester: semesterCurrent.name,
      };
    });
  }

  // api lấy danh sách các danh mục học phí của sinh viên
  async getTuitionFees(studentId: number) {
    const fees = await this.prisma.feeInvoiceItem.findMany({
      where: {
        studentId: studentId,
      },
    });

    return fees.map(
      (fee) =>
        new TuitionFeeItemsDto({
          ...fee,
          status: fee.status as FeeInvoiceItemStatus,
        }),
    );
  }

  // lấy hết
  async getAllTuitionFees() {
    const result = await this.prisma.feeInvoiceItem.findMany({});
    return result;
  }

  // Get danh sách học sinh có học phí để đóng
  async getStudentTuition(query: SearchTuitionDto) {
    const { studentCode, semesterId } = query;

    const students = await this.prisma.student.findMany({
      where: {
        // Tìm kiếm theo studentCode nếu có
        ...(studentCode
          ? { studentCode: { contains: studentCode, mode: "insensitive" } }
          : {}),

        // Chỉ lấy những sinh viên có hóa đơn trong học kỳ này (nếu có lọc semesterId)
        ...(semesterId
          ? {
              feeInvoices: {
                some: { semesterId: semesterId },
              },
            }
          : {}),
      },
      include: {
        batch: {
          include: {
            major: true,
          },
        }, // Để lấy thông tin khóa học
        feeInvoices: {
          where: semesterId ? { semesterId: semesterId } : {},
          include: {
            semester: true,
            items: {
              include: {
                allocations: true, // Để xem chi tiết lịch sử đóng tiền của từng món
              },
            },
          },
        },
      },
    });

    // Format lại dữ liệu trả về cho Frontend
    return students.map((student) => {
      // Lấy hóa đơn của kỳ đang tìm kiếm
      const invoice = student.feeInvoices[0];

      return {
        id: student.id,
        studentCode: student.studentCode,
        fullName: student.fullName,
        batchName: student.batch?.batchName,
        majorName: student.batch?.major?.majorName,
        tuitionInfo: invoice
          ? {
              semesterName: invoice.semester.name,
              totalAmount: invoice.totalAmount,
              status: invoice.status, // unpaid, partial, paid
              // Chi tiết từng loại phí (Học phí môn học, BHYT, Phí nhập học...)
              details: invoice.items.map((item) => ({
                itemName: item.name,
                amount: item.amount,
                status: item.status,
                paidAmount: item.allocations.reduce(
                  (sum, acc) => sum + acc.amount,
                  0,
                ),
              })),
            }
          : null,
      };
    });
  }

  // Thanh toán học phí
  // Phải đóng tối thiểu 40% học phí để được tính là đã đóng (partial), nếu đóng đủ sẽ là paid
  async payTuitionFee(data: PayTuitionFeeDto) {
    const { studentId, itemsPaymented, semesterId } = data;

    // Ép kiểu an toàn để tránh lỗi data type mismatch (string vs int) giữa FE và BE
    const numericItemIds = itemsPaymented.map((id) => Number(id));
    const numericStudentId = Number(studentId);
    const numericSemesterId = Number(semesterId);

    // 1. Kiểm tra các khoản phí hợp lệ trước khi mở Transaction
    const items = await this.prisma.feeInvoiceItem.findMany({
      where: {
        id: { in: numericItemIds },
        studentId: numericStudentId,
        status: FeeInvoiceItemStatus.UNPAID,
      },
    });

    if (items.length === 0) {
      throw new NotFoundException("Không tìm thấy khoản phí nào để thanh toán");
    }

    // 2. Chạy Transaction để đảm bảo tính an toàn dữ liệu
    return await this.prisma.$transaction(async (tx) => {
      // Gạch nợ: Cập nhật status các item sang PAID
      await tx.feeInvoiceItem.updateMany({
        where: {
          id: { in: numericItemIds },
          studentId: numericStudentId,
        },
        data: {
          status: FeeInvoiceItemStatus.PAID,
        },
      });

      // Tạo hóa đơn thanh toán thành công
      const invoice = await tx.feeInvoice.create({
        data: {
          studentId: numericStudentId,
          totalAmount: items.reduce((sum, i) => sum + i.amount, 0),
          semesterId: numericSemesterId,
          status: "paid", // Đánh dấu hóa đơn tổng đã được thanh toán
        },
      });

      // Lấy thông tin chi tiết sinh viên để kiểm tra trạng thái và lấy mã sinh viên (MSSV)
      const student = await tx.student.findUnique({
        where: { id: numericStudentId },
      });

      // Kiểm tra nếu học sinh status là approved thì tạo tài khoản và chuyển trạng thái
      if (student && student.status === StudentStatus.approved) {
        // Khởi tạo thông tin đăng nhập: username là mssv (studentCode)
        const username = student.studentCode;

        // Kiểm tra xem username này đã vô tình tồn tại trong hệ thống chưa (tránh trùng unique)
        const existingUser = await tx.user.findUnique({
          where: { username },
        });

        if (!existingUser) {
          // Mã hóa mật khẩu mặc định "123456"
          const salt = await bcrypt.genSalt();
          const passwordHash = await bcrypt.hash("123456", salt);

          // Tạo tài khoản User mới
          const newUser = await tx.user.create({
            data: {
              userId: generateId(), // Sinh mã định danh ngoại duy nhất
              username: username,
              passwordHash: passwordHash,
              role: RoleType.student, // Enum Role của bạn (Ví dụ: STUDENT hoặc đặt theo hệ thống của bạn)
              isActive: true,
            },
          });

          // Cập nhật tài khoản vào bản ghi Student đồng thời đổi trạng thái sang "studying"
          await tx.student.update({
            where: { id: numericStudentId },
            data: {
              userId: newUser.id, // Liên kết quan hệ 1-1 với bảng User
              status: StudentStatus.studying, // Đóng tiền xong chính thức đi học
            },
          });
        }
      }

      return invoice;
    });
  }

  // get invoice theo studentCode
  async getTuitionInvoiceByStudentCode(studentCode: string) {
    const student = await this.prisma.student.findUnique({
      where: { studentCode },
    });

    if (!student) {
      throw new NotFoundException("Sinh viên không tồn tại");
    }

    const invoices = await this.prisma.feeInvoice.findMany({
      where: { studentId: student.id },
      include: {
        semester: true,
      },
    });

    return invoices.map((invoice) => new InvoiceDto(invoice));
  }
}
