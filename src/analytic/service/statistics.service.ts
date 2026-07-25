import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class StatisticsService {
  constructor(private prisma: PrismaService) {}

  async getOverviewStats() {
    // Sử dụng Promise.all để tối ưu hóa hiệu năng, chạy song song các câu lệnh đếm
    const [totalStudents, totalTeachers, studyingStudents, pendingStudents, registerStudents] = await Promise.all([
      // 1. Tổng số học sinh (tất cả trạng thái)
      this.prisma.student.count(),

      // 2. Tổng số giáo viên (Staff có EmployeeRole = TEACHER)
      this.prisma.staff.count({
        where: {
          employeeRole: "TEACHER",
        },
      }),

      // 3. Số học sinh đang học
      this.prisma.student.count({
        where: { status: "STUDYING" },
      }),

      // 4. Số học sinh đang đợi xét tuyển
      this.prisma.admissionProfile.count({
        where: { status: "SUBMITTED" },
      }),

      // 5. Số học sinh đăng ký mới (tư vấn)
      this.prisma.admissionProfile.count({
        where: { status: "REGISTERED" },
      }),
    ]);

    return {
      totalStudents,
      totalTeachers,
      studyingStudents,
      pendingStudents,
      registerStudents,
    };
  }

  async getAdvancedAnalytics() {
    // 1. Lấy học kỳ hiện tại để làm mốc thống kê vận hành
    const currentSemester = await this.prisma.semester.findFirst({
      where: { isCurrent: true },
    });

    // Tìm đợt thu học phí đang hoạt động thuộc học kỳ hiện tại
    const currentTuitionPeriod = currentSemester
      ? await this.prisma.tuitionPeriod.findFirst({
          where: {
            semesterId: currentSemester.id,
            isActive: true,
          },
        })
      : null;

    const [
      // --- NHÓM 1: VẬN HÀNH LỚP HỌC & SĨ SỐ ---
      classesData,

      // --- NHÓM 2: TÌNH HÌNH TÀI CHÍNH & HỌC PHÍ (Nếu có đợt thu học phí hiện tại) ---
      tuitionInvoicesStats,
      recentPaymentsData,
    ] = await Promise.all([
      // Lấy danh sách lớp học để tính toán tỉ lệ lấp đầy và trạng thái
      this.prisma.class.findMany({
        select: { className: true, currentSize: true, maxStudents: true },
      }),

      // Thống kê hóa đơn học phí của đợt hiện tại (Tổng tiền, thực thu, còn thiếu, phân loại trạng thái)
      currentTuitionPeriod
        ? this.prisma.feeInvoice.aggregate({
            where: { periodId: currentTuitionPeriod.id },
            _sum: {
              totalAmount: true,
              paidAmount: true,
              remainingAmount: true,
            },
            _count: {
              id: true,
            },
          })
        : Promise.resolve(null),

      // Lấy danh sách giao dịch thành công gần đây của đợt hiện tại để render bảng "Dòng tiền gần đây"
      currentTuitionPeriod
        ? this.prisma.payment.findMany({
            where: {
              invoice: { periodId: currentTuitionPeriod.id },
              status: "SUCCESS",
            },
            take: 5,
            orderBy: { paymentDate: "desc" },
            select: {
              id: true,
              amountPaid: true,
              paymentDate: true,
              method: true,
              student: {
                select: {
                  fullName: true,
                  studentCode: true,
                },
              },
            },
          })
        : Promise.resolve([]),
    ]);

    // Lấy thêm phân phối số lượng hóa đơn theo từng trạng thái (unpaid, partial, paid)
    const invoiceStatusDistribution = { unpaid: 0, partial: 0, paid: 0 };
    if (currentTuitionPeriod) {
      const groupStatus = await this.prisma.feeInvoice.groupBy({
        by: ["status"],
        where: { periodId: currentTuitionPeriod.id },
        _count: { id: true },
      });

      groupStatus.forEach((item) => {
        if (item.status === "unpaid") invoiceStatusDistribution.unpaid = item._count.id;
        if (item.status === "partial") invoiceStatusDistribution.partial = item._count.id;
        if (item.status === "paid") invoiceStatusDistribution.paid = item._count.id;
      });
    }

    // --- XỬ LÝ LOGIC SỐ LIỆU ---

    // 1. Tính toán tỷ lệ lấp đầy trung bình của toàn trường (Capacity Rate)
    const totalMaxStudents = classesData.reduce((sum, c) => sum + c.maxStudents, 0);
    const totalCurrentStudents = classesData.reduce((sum, c) => sum + c.currentSize, 0);
    const schoolFillRate =
      totalMaxStudents > 0 ? parseFloat(((totalCurrentStudents / totalMaxStudents) * 100).toFixed(2)) : 0;

    // Tìm các lớp đang có nguy cơ quá tải (sĩ số vượt hoặc bằng max)
    const overloadedClasses = classesData
      .filter((c) => c.currentSize >= c.maxStudents)
      .map((c) => ({
        className: c.className,
        size: `${c.currentSize}/${c.maxStudents}`,
      }));

    // 2. Tính toán hiệu suất thu học phí (Financial Metrics)
    const totalInvoiced = tuitionInvoicesStats?._sum?.totalAmount || 0;
    const totalCollected = tuitionInvoicesStats?._sum?.paidAmount || 0;
    const totalRemaining = tuitionInvoicesStats?._sum?.remainingAmount || 0;
    const totalInvoicesCount = tuitionInvoicesStats?._count?.id || 0;

    const collectionRate = totalInvoiced > 0 ? parseFloat(((totalCollected / totalInvoiced) * 100).toFixed(2)) : 0;

    return {
      semesterName: currentSemester?.name || "Chưa thiết lập học kỳ hiện tại",
      classrooms: {
        totalActiveClasses: classesData.length,
        schoolFillRate, // % lấp đầy toàn trường
        overloadedClassesCount: overloadedClasses.length, // Số lượng lớp quá tải
        overloadedClasses, // Danh sách cụ thể các lớp quá tải
        totalCurrentStudents,
        totalMaxStudents,
      },
      finance: currentTuitionPeriod
        ? {
            periodName: currentTuitionPeriod.name,
            startDate: currentTuitionPeriod.startDate,
            endDate: currentTuitionPeriod.endDate,
            metrics: {
              totalInvoiced, // Tổng tiền phát hành hóa đơn (phải thu)
              totalCollected, // Tổng tiền thực tế đã thu thành công
              totalRemaining, // Tổng tiền sinh viên còn nợ
              collectionRate, // Tỷ lệ hoàn thành thu học phí (%)
              totalInvoicesCount, // Tổng số lượng hóa đơn phát hành
            },
            statusDistribution: invoiceStatusDistribution, // { unpaid: X, partial: Y, paid: Z }
            recentPayments: recentPaymentsData.map((p) => ({
              id: p.id,
              studentName: p.student?.fullName || "N/A",
              studentCode: p.student?.studentCode || "N/A",
              amountPaid: p.amountPaid,
              paymentDate: p.paymentDate,
              method: p.method,
            })),
          }
        : null,
    };
  }
}
