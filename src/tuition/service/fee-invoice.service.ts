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
} from "../dto/fee-invoice.dto";
import { PrismaService } from "../../prisma/prisma.service";
import { PaymentService } from "./payment.service";

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
  async create(createDto: CreateFeeInvoiceDto): Promise<FeeInvoiceDto> {
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
            method: "CASH", // Hoặc cấu hình một phương thức mặc định ban đầu
            transactionRef: `INIT_INVOICE_${invoice.id}`,
            createdBy: "SYSTEM",
          },
          client, // Gửi client transaction xuống để chạy chung chu kỳ
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

  // ==========================================
  // 2. READ ALL / SEARCH
  // ==========================================
  async findAll(
    searchDto: SearchFeeInvoiceDto,
    tx?: Prisma.TransactionClient,
  ): Promise<FeeInvoiceDto[]> {
    const client = this.getClient(tx);
    const where: Prisma.FeeInvoiceWhereInput = {};

    if (searchDto.studentId) where.studentId = searchDto.studentId;
    if (searchDto.periodId) where.periodId = searchDto.periodId;
    if (searchDto.status) where.status = searchDto.status;

    const results = await client.feeInvoice.findMany({ where });
    return plainToInstance(FeeInvoiceDto, results);
  }

  // ==========================================
  // 3. READ ONE
  // ==========================================
  async findOne(
    id: number,
    tx?: Prisma.TransactionClient,
  ): Promise<FeeInvoiceDto> {
    const client = this.getClient(tx);
    const invoice = await client.feeInvoice.findUnique({ where: { id } });

    if (!invoice) {
      throw new NotFoundException(`Hóa đơn học phí với ID ${id} không tồn tại`);
    }
    return this.toResponseDto(FeeInvoiceDto, invoice);
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
      // 4.1 Kiểm tra xem hóa đơn cũ đang có số tiền như thế nào
      const oldInvoice = await this.findOne(id, client);

      // 4.2 Tiến hành cập nhật hóa đơn học phí
      const updatedInvoice = await client.feeInvoice.update({
        where: { id },
        data: updateDto,
      });

      // 4.3 Tính toán độ lệch số tiền đã đóng (Khách đóng thêm tiền)
      const diffPaidAmount =
        (updateDto.paidAmount ?? oldInvoice.paidAmount) - oldInvoice.paidAmount;

      // Nếu số tiền đóng thêm lớn hơn 0, tiến hành tạo thêm 1 lịch sử Payment giao dịch mới
      if (diffPaidAmount > 0) {
        await this.paymentService.create(
          {
            invoiceId: updatedInvoice.id,
            studentId: updatedInvoice.studentId,
            amountPaid: diffPaidAmount, // Số tiền thực tế vừa đóng thêm trong lượt update này
            method: "TRANSFER", // Hoặc có thể mở rộng DTO update để nhận method từ Client gửi lên
            transactionRef: `UPDATE_INVOICE_${updatedInvoice.id}`,
            createdBy: "SYSTEM",
          },
          client, // Chạy chung transaction
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
