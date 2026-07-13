import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getTuitionOverview(periodId: number) {
    if (!periodId) {
      throw new BadRequestException(
        "Vui lòng cung cấp periodId (Đợt thu học phí)",
      );
    }

    try {
      // Chạy song song các query để tối ưu hiệu năng
      const [
        kpiData,
        statusDistribution,
        paymentMethodDistribution,
        recentPayments,
        topDebtors,
      ] = await Promise.all([
        // 1. KPI TỔNG QUAN
        this.prisma.feeInvoice.aggregate({
          where: { periodId },
          _sum: {
            totalAmount: true,
            paidAmount: true,
            remainingAmount: true,
          },
          _count: { id: true },
        }),

        // 2. BIỂU ĐỒ TRẠNG THÁI HÓA ĐƠN
        this.prisma.feeInvoice.groupBy({
          by: ["status"],
          where: { periodId },
          _count: { id: true },
          _sum: { totalAmount: true },
        }),

        // 3. BIỂU ĐỒ PHƯƠNG THỨC THANH TOÁN
        this.prisma.payment.groupBy({
          by: ["method"],
          where: {
            invoice: { periodId },
            status: "SUCCESS",
          },
          _sum: { amountPaid: true },
          _count: { id: true },
        }),

        // 4. LỊCH SỬ 5 GIAO DỊCH GẦN NHẤT
        this.prisma.payment.findMany({
          where: {
            invoice: { periodId },
            status: "SUCCESS",
          },
          orderBy: { paymentDate: "desc" },
          take: 5,
          include: {
            student: {
              select: { id: true }, // Thêm trường name nếu model Student của bạn có
            },
          },
        }),

        // 5. TOP 5 HỌC SINH NỢ NHIỀU NHẤT
        this.prisma.feeInvoice.findMany({
          where: {
            periodId,
            status: { in: ["unpaid", "partial"] },
            remainingAmount: { gt: 0 },
          },
          orderBy: { remainingAmount: "desc" },
          take: 5,
          include: {
            student: {
              select: { id: true },
            },
          },
        }),
      ]);

      // Tính toán tỷ lệ hoàn thành (Collection Rate)
      const totalBilled = kpiData._sum.totalAmount || 0;
      const totalCollected = kpiData._sum.paidAmount || 0;
      const totalOutstanding = kpiData._sum.remainingAmount || 0;
      const collectionRate =
        totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0;

      return {
        kpis: {
          totalInvoices: kpiData._count.id,
          totalBilled,
          totalCollected,
          totalOutstanding,
          collectionRate: Math.round(collectionRate * 100) / 100,
        },
        statusDistribution: statusDistribution.map((item) => ({
          status: item.status,
          count: item._count.id,
          amount: item._sum.totalAmount || 0,
        })),
        paymentMethods: paymentMethodDistribution.map((item) => ({
          method: item.method,
          count: item._count.id,
          amount: item._sum.amountPaid || 0,
        })),
        recentPayments,
        topDebtors,
      };
    } catch (error) {
      console.log("Error fetching dashboard data:", error);
      throw new InternalServerErrorException(
        "Lỗi hệ thống khi lấy dữ liệu dashboard",
      );
    }
  }

  async getPaymentTrend(periodId: number) {
    if (!periodId) {
      throw new BadRequestException("Vui lòng cung cấp periodId");
    }

    try {
      const trend: any[] = await this.prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('day', p."paymentDate") as "date",
          SUM(p."amountPaid") as "dailyAmount"
        FROM payments p
        JOIN fee_invoices f ON p."invoiceId" = f.id
        WHERE f."periodId" = ${periodId} AND p.status = 'SUCCESS'
        GROUP BY DATE_TRUNC('day', p."paymentDate")
        ORDER BY "date" ASC
      `;

      return trend;
    } catch (error) {
      console.log("Error fetching payment trend:", error);
      throw new InternalServerErrorException(
        "Lỗi lấy dữ liệu biểu đồ dòng tiền",
      );
    }
  }
}
