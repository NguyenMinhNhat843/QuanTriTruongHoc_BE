import { Injectable, NotFoundException } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import {
  CreatePaymentDto,
  UpdatePaymentDto,
  SearchPaymentDto,
  PaymentDto,
} from "../dto/payment.dto"; // Điều chỉnh lại đường dẫn DTO cho đúng
import { PrismaService } from "../../prisma/prisma.service";
import { Prisma } from "../../../prisma/generated/prisma/client";

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper hỗ trợ lấy client thích hợp (Dùng transaction bên ngoài truyền vào hoặc dùng client mặc định)
   */
  private getClient(tx?: Prisma.TransactionClient) {
    return tx ?? this.prisma;
  }

  /**
   * Helper chuyển đổi dữ liệu trả về thành DTO đảm bảo TypeSafe
   */
  private toResponseDto<T>(dtoClass: new () => T, data: any): T {
    return plainToInstance(dtoClass, data, {
      excludeExtraneousValues: false,
    });
  }

  // ==========================================
  // 1. CREATE (Tạo giao dịch thanh toán)
  // ==========================================
  async create(
    createDto: CreatePaymentDto,
    tx?: Prisma.TransactionClient,
  ): Promise<PaymentDto> {
    const client = this.getClient(tx);

    const result = await client.payment.create({
      data: {
        ...createDto,
        status: "SUCCESS", // Gán trạng thái mặc định do Create DTO đã lược bỏ status (hoặc PENDING tùy business)
        paymentDate: new Date(), // Gán thời gian thanh toán hiện tại do Create DTO lược bỏ
      },
    });

    return this.toResponseDto(PaymentDto, result);
  }

  // ==========================================
  // 2. READ ALL / SEARCH (Tìm kiếm giao dịch)
  // ==========================================
  async findAll(
    searchDto: SearchPaymentDto,
    tx?: Prisma.TransactionClient,
  ): Promise<PaymentDto[]> {
    const client = this.getClient(tx);
    const where: Prisma.PaymentWhereInput = {};

    // Gán các điều kiện lọc động
    if (searchDto.invoiceId) where.invoiceId = searchDto.invoiceId;
    if (searchDto.studentId) where.studentId = searchDto.studentId;
    if (searchDto.method) where.method = searchDto.method;
    if (searchDto.status) where.status = searchDto.status;

    const results = await client.payment.findMany({ where });

    return plainToInstance(PaymentDto, results);
  }

  // ==========================================
  // 3. READ ONE (Lấy chi tiết giao dịch theo ID)
  // ==========================================
  async findOne(
    id: number,
    tx?: Prisma.TransactionClient,
  ): Promise<PaymentDto> {
    const client = this.getClient(tx);

    const payment = await client.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException(
        `Giao dịch thanh toán với ID ${id} không tồn tại`,
      );
    }

    return this.toResponseDto(PaymentDto, payment);
  }

  // ==========================================
  // 4. UPDATE (Cập nhật thông tin giao dịch)
  // ==========================================
  async update(
    id: number,
    updateDto: UpdatePaymentDto,
    tx?: Prisma.TransactionClient,
  ): Promise<PaymentDto> {
    const client = this.getClient(tx);

    // Kiểm tra tồn tại trước khi update
    await this.findOne(id, tx);

    const result = await client.payment.update({
      where: { id },
      data: updateDto,
    });

    return this.toResponseDto(PaymentDto, result);
  }

  // ==========================================
  // 5. DELETE (Xóa giao dịch)
  // ==========================================
  async remove(
    id: number,
    tx?: Prisma.TransactionClient,
  ): Promise<{ message: string }> {
    const client = this.getClient(tx);

    // Kiểm tra tồn tại trước khi xóa
    await this.findOne(id, tx);

    await client.payment.delete({
      where: { id },
    });

    return { message: `Xóa thành công giao dịch có ID ${id}` };
  }
}
