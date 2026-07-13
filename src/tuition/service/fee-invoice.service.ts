import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { Prisma } from "../../../prisma/generated/prisma/client";
import { plainToInstance } from "class-transformer";
import {
  CreateFeeInvoiceDto,
  UpdateFeeInvoiceDto,
  SearchFeeInvoiceDto,
  FeeInvoiceDto,
  FeeInvoiceWithPaymentsDto,
  FeeInvoiceWithStudentDto,
} from "../dto/fee-invoice.dto";
import { PrismaService } from "../../prisma/prisma.service";
import { PaymentService } from "./payment.service";
import { AuthUserResponseDto } from "../../auth/dto/auth-user-response.dto";

@Injectable()
export class FeeInvoiceService {
  constructor(
    private readonly prisma: PrismaService,
    // Sử dụng forwardRef nếu có hiện tượng vòng lặp dependency (Circular Dependency) giữa Invoice và Payment
    @Inject(forwardRef(() => PaymentService))
    private readonly paymentService: PaymentService,
  ) {}

  private getClient(tx?: Prisma.TransactionClient) {
    return tx ?? this.prisma;
  }

  private toResponseDto<T>(dtoClass: new () => T, data: any): T {
    return plainToInstance(dtoClass, data, {
      excludeExtraneousValues: false,
    });
  }

  // ==========================================
  // 1. CREATE (Tạo hóa đơn học phí + Tạo Payment ban đầu)
  // ==========================================
  async create(
    createDto: CreateFeeInvoiceDto,
    user?: AuthUserResponseDto,
  ): Promise<FeeInvoiceDto> {
    if (!user || user.role === "student" || user.role === "teacher") {
      throw new NotFoundException(
        `Bạn không có quyền tạo hóa đơn học phí. Vui lòng liên hệ quản trị viên để được hỗ trợ.`,
      );
    }

    const executeLogic = async (client: Prisma.TransactionClient) => {
      // 1.1 Tạo hóa đơn học phí
      const invoice = await client.feeInvoice.create({
        data: {
          ...createDto,
          status:
            createDto.remainingAmount <= 0
              ? "PAID"
              : createDto.paidAmount > 0
                ? "PARTIALLY_PAID"
                : "PENDING",
        },
      });

      // 1.2 Nếu lúc tạo mới có phát sinh số tiền đã đóng (paidAmount > 0), tự động ghi nhận 1 bản ghi Payment
      if (createDto.paidAmount > 0) {
        await this.paymentService.create(
          {
            invoiceId: invoice.id,
            studentId: invoice.studentId,
            amountPaid: createDto.paidAmount,
            method: "CASH",
            transactionRef: `INIT_INVOICE_${invoice.id}`,
            createdBy: user.fullName || "SYSTEM",
          },
          client,
        );
      }

      return invoice;
    };

    // Nếu ngoài truyền tx vào thì chạy trực tiếp, không bọc transaction trùng lặp
    const result = await this.prisma.$transaction(
      async (newTx) => await executeLogic(newTx),
    );

    return this.toResponseDto(FeeInvoiceDto, result);
  }

  /**
   * Lấy chi tiết công nợ hóa đơn của 1 học sinh trong 1 đợt học phí cụ thể
   * Tìm kiếm thông qua StudentCode thay vì ID tự tăng
   */
  async getStudentDebtDetails(
    identifier: string,
    periodId: number,
  ): Promise<any> {
    const searchKey = identifier.trim();
    const invoice = await this.prisma.feeInvoice.findFirst({
      where: {
        periodId: periodId,
        student: {
          OR: [{ studentCode: searchKey }, { phone: searchKey }],
        },
      },
      include: {
        student: {
          select: {
            id: true,
            studentCode: true,
            fullName: true,
            status: true,
            phone: true,
            batch: {
              select: {
                batchCode: true,
                batchName: true,
              },
            },
            major: {
              select: {
                majorName: true,
                majorCode: true,
              },
            },
            class: {
              select: {
                className: true,
              },
            },
          },
        },
        // Include thêm lịch sử thanh toán để làm bảng đối soát ở góc Modal nếu cần
        payments: {
          orderBy: {
            paymentDate: "desc",
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(
        `Không tìm thấy dữ liệu công nợ học phí cho sinh viên [${searchKey}] trong đợt thu này. Vui lòng kiểm tra lại mã sinh viên hoặc đồng bộ lại công nợ.`,
      );
    }

    return plainToInstance(FeeInvoiceWithStudentDto, invoice);
  }

  // ==========================================
  // 2. READ ALL / SEARCH
  // ==========================================
  async findAll(searchDto: SearchFeeInvoiceDto, tx?: Prisma.TransactionClient) {
    const client = this.getClient(tx);
    const where: Prisma.FeeInvoiceWhereInput = {};

    if (searchDto.studentId) where.studentId = searchDto.studentId;
    if (searchDto.periodId) where.periodId = searchDto.periodId;
    if (searchDto.status) where.status = searchDto.status;

    const page = Number(searchDto.page) || 1;
    const limit = Number(searchDto.limit) || 10;
    const skip = (page - 1) * limit;

    const [results, totalItems] = await Promise.all([
      client.feeInvoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: "desc" },
      }),
      client.feeInvoice.count({ where }),
    ]);

    const data = plainToInstance(FeeInvoiceDto, results);

    return {
      data,
      total: totalItems,
    };
  }

  // ==========================================
  // 3. READ ONE
  // ==========================================
  async findOne(
    id: number,
    tx?: Prisma.TransactionClient,
  ): Promise<FeeInvoiceWithPaymentsDto> {
    const client = this.getClient(tx);
    const invoice = await client.feeInvoice.findUnique({
      where: { id },
      include: {
        payments: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Hóa đơn học phí với ID ${id} không tồn tại`);
    }
    return this.toResponseDto(FeeInvoiceWithPaymentsDto, invoice);
  }

  // ==========================================
  // 4. UPDATE (Cập nhật hóa đơn + Tạo tiếp 1 Payment bổ sung)
  // ==========================================
  async update(
    id: number,
    updateDto: UpdateFeeInvoiceDto,
    tx?: Prisma.TransactionClient,
  ): Promise<FeeInvoiceDto> {
    const executeLogic = async (client: Prisma.TransactionClient) => {
      const oldInvoice = await client.feeInvoice.findUnique({
        where: { id },
        include: { payments: true },
      });
      if (!oldInvoice) throw new NotFoundException("Không tìm thấy hóa đơn");

      // Giả sử DTO gửi lên số tiền ĐÃ ĐÓNG LŨY KẾ mới (updateDto.paidAmount)
      // Hoặc bạn nên thiết kế DTO nhận số tiền nộp lần này: updateDto.amountPaidThisTime
      const newPaidAmount = updateDto.paidAmount ?? oldInvoice.paidAmount;

      // Tính toán lại số tiền còn thiếu dựa trên tổng tiền cố định ban đầu
      const newRemainingAmount = oldInvoice.totalAmount - newPaidAmount;

      // Tự động tính toán lại trạng thái chuẩn xác
      let newStatus = "unpaid";
      if (newRemainingAmount <= 0) {
        newStatus = "paid";
      } else if (newPaidAmount > 0) {
        newStatus = "partial"; // Đồng bộ với các enum viết thường trong comment schema của bạn
      }

      // 4.2 Tiến hành cập nhật hóa đơn học phí với dữ liệu đã được tính toán tự động
      const {
        paymentMethod,
        transactionRef,
        staffName,
        ...updateFeeInvoiceData
      } = updateDto;
      const updatedInvoice = await client.feeInvoice.update({
        where: { id },
        data: {
          ...updateFeeInvoiceData,
          paidAmount: newPaidAmount,
          remainingAmount: newRemainingAmount,
          status: newStatus,
        },
      });

      // 4.3 Tạo lịch sử Payment giao dịch mới (Giữ nguyên logic diffPaidAmount > 0 của bạn)
      const diffPaidAmount = newPaidAmount - oldInvoice.paidAmount;
      if (diffPaidAmount > 0) {
        await this.paymentService.create(
          {
            invoiceId: updatedInvoice.id,
            studentId: updatedInvoice.studentId,
            amountPaid: diffPaidAmount,
            method: paymentMethod ?? "CASH", // Nên lấy từ client truyền lên thay vì áp cứng TRANSFER
            transactionRef:
              transactionRef ?? `QUAY_THU_${updatedInvoice.id}_${Date.now()}`,
            createdBy: staffName ?? "CASHIER_SYSTEM", // Định danh nhân viên thu tiền
          },
          client,
        );
      }

      return updatedInvoice;
    };

    const result = tx
      ? await executeLogic(tx)
      : await this.prisma.$transaction(
          async (newTx) => await executeLogic(newTx),
        );

    return this.toResponseDto(FeeInvoiceDto, result);
  }

  // ==========================================
  // 5. DELETE
  // ==========================================
  async remove(id: number): Promise<{ message: string }> {
    const executeLogic = async (client: Prisma.TransactionClient) => {
      await this.findOne(id, client);

      // Nếu db của bạn chưa cấu hình Cascade Delete cho Payments khi Invoice bị xóa,
      // bạn cần chủ động xóa lịch sử payments trước để tránh dính lỗi Foreign Key Constraint.
      await client.payment.deleteMany({
        where: { invoiceId: id },
      });

      await client.feeInvoice.delete({ where: { id } });
    };

    await this.prisma.$transaction(async (newTx) => await executeLogic(newTx));

    return {
      message: `Xóa thành công hóa đơn học phí và toàn bộ lịch sử thanh toán của ID ${id}`,
    };
  }
}
