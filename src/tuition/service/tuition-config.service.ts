import { Injectable, InternalServerErrorException, Logger, NotFoundException } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import {
  CreateTuitionConfigDto,
  UpdateTuitionConfigDto,
  SearchTuitionConfigDto,
  TuitionConfigWithItemsDto,
} from "../dto/tuition-config.dto"; // Điều chỉnh lại đường dẫn cho đúng
import { PrismaService } from "../../prisma/prisma.service";
import { Prisma } from "../../../prisma/generated/prisma/client";

@Injectable()
export class TuitionConfigService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper function để transform data sang DTO mong muốn
   */
  private toResponseDto<T>(dtoClass: new () => T, data: any): T {
    return plainToInstance(dtoClass, data, {
      excludeExtraneousValues: false, // Để false nếu bạn muốn map tự động các trường không có @Expose()
    });
  }

  // ==========================================
  // 1. CREATE (Tạo Config kèm theo Items)
  // ==========================================
  async create(createDto: CreateTuitionConfigDto): Promise<TuitionConfigWithItemsDto> {
    const { items, ...configData } = createDto;

    // Chạy trong 1 Transaction để nếu lỗi tạo items thì config cũng bị rollback
    const result = await this.prisma.$transaction(async (tx) => {
      const config = await tx.tuitionConfig.create({
        data: {
          ...configData,
          items: {
            create: items, // Prisma tự động map configId cho các item con
          },
        },
        include: {
          items: true, // Lấy kèm các item vừa tạo để trả về
        },
      });
      await this.generateInvoicesFromConfig(config, tx);
      return config;
    });

    return this.toResponseDto(TuitionConfigWithItemsDto, result);
  }

  /**
   * API: Kích hoạt sinh công nợ thủ công cho một cấu hình học phí cụ thể
   */
  async triggerManualGenerateInvoices(configId: number): Promise<{ success: boolean; count: number }> {
    const config = await this.findOne(configId);

    // 2. Chạy transaction để thực hiện quét và tạo hóa đơn
    return await this.prisma.$transaction(async (tx) => {
      // Gọi hàm helper (chính là hàm private ta viết ở câu trước nhưng truyền tx vào)
      const count = await this.generateInvoicesFromConfig(config, tx);
      return { success: true, count: count || 0 };
    });
  }

  /**
   * Logic tách biệt: Quét sinh viên theo ngành/khóa để hạ công nợ cụ thể
   */
  private async generateInvoicesFromConfig(config: any, tx: Prisma.TransactionClient) {
    try {
      // 2.1 Tìm các đợt khóa học (Batches) đang hoạt động thuộc ngành này
      // Nếu cấu hình có chỉ định đích danh batchId, ta chỉ lọc đúng batchId đó.
      const targetBatches = await tx.batch.findMany({
        where: {
          status: "ACTIVE",
          majorId: config.majorId ? config.majorId : undefined,
          id: config.batchId ? config.batchId : undefined,
        },
        select: { id: true },
      });
      Logger.log(
        `[TuitionConfigService] Đang sinh công nợ cho configId=${config.id}, tìm thấy ${targetBatches.length} batch thỏa mãn.`,
      );

      const batchIds = targetBatches.map((b) => b.id);
      if (batchIds.length === 0) return;

      // 2.2 Lấy toàn bộ sinh viên đang học thuộc các Khóa thỏa mãn ở trên
      const students = await tx.student.findMany({
        where: {
          batchId: { in: batchIds },
          // majorId: config.majorId ? config.majorId : undefined,
          status: "STUDYING",
        },
        select: { id: true },
      });
      Logger.log(
        `[TuitionConfigService] Đang sinh công nợ cho configId=${config.id}, tìm thấy ${students.length} sinh viên thỏa mãn.`,
      );

      if (students.length === 0) return;

      // 2.3 Chuẩn bị data hóa đơn với số tiền "đóng gói" từ định mức vừa cấu hình
      const invoicesToCreate: Prisma.FeeInvoiceCreateManyInput[] = students.map((student) => ({
        studentId: student.id,
        periodId: config.periodId,
        totalAmount: config.totalAmount, // Lấy từ cấu hình qua
        minRequiredAmount: config.minRequiredAmount, // Lấy từ cấu hình qua
        paidAmount: 0, // Mới sinh công nợ nên chưa đóng đồng nào
        remainingAmount: config.totalAmount, // Số nợ = Tổng tiền phải đóng
        status: "unpaid", // Trạng thái: Chưa thanh toán
      }));

      // 2.4 Thực hiện insert hàng loạt (Bulk Insert) để tối ưu hiệu năng tối đa
      const result = await tx.feeInvoice.createMany({
        data: invoicesToCreate,
        skipDuplicates: true,
      });
      return result.count;
    } catch (error) {
      console.error("Lỗi hệ thống khi sinh hóa đơn theo ngành:", error);
      throw new InternalServerErrorException(
        "Lưu cấu hình thành công nhưng không thể kích hoạt tạo hóa đơn công nợ cho sinh viên.",
      );
    }
  }

  // ==========================================
  // 2. READ ALL / SEARCH (Tìm kiếm nâng cao)
  // ==========================================
  async findAll(searchDto: SearchTuitionConfigDto): Promise<TuitionConfigWithItemsDto[]> {
    const where: any = {};

    // Gán điều kiện tìm kiếm động nếu có truyền lên
    if (searchDto.periodId) where.periodId = searchDto.periodId;
    if (searchDto.majorId) where.majorId = searchDto.majorId;
    if (searchDto.batchId) where.batchId = searchDto.batchId;

    const results = await this.prisma.tuitionConfig.findMany({
      where,
      include: {
        items: true,
        major: true,
      },
    });

    return plainToInstance(TuitionConfigWithItemsDto, results);
  }

  // ==========================================================
  // LẤY DANH SÁCH NGÀNH CHƯA ĐƯỢC CẤU HÌNH TRONG ĐỢT
  // ==========================================================
  async findUnconfiguredMajors(periodId: number): Promise<any[]> {
    // 1. Tìm tất cả các majorId đã được cấu hình trong TuitionPeriod này
    const configuredConfigs = await this.prisma.tuitionConfig.findMany({
      where: {
        periodId: periodId,
        majorId: { not: null }, // Bỏ qua cấu hình áp dụng toàn trường
      },
      select: { majorId: true },
    });

    const configuredMajorIds = configuredConfigs.map((c) => c.majorId).filter((id): id is number => id !== null);

    // 2. Lấy ra các ngành học mà ID KHÔNG nằm trong danh sách đã được cấu hình ở trên
    const unconfiguredMajors = await this.prisma.major.findMany({
      where: {
        id: {
          notIn: configuredMajorIds,
        },
      },
      select: {
        id: true,
        majorCode: true,
        majorName: true,
        deptId: true,
      },
      orderBy: {
        majorName: "asc",
      },
    });

    return unconfiguredMajors;
  }

  // ==========================================
  // 3. READ ONE (Lấy chi tiết theo ID)
  // ==========================================
  async findOne(id: number): Promise<TuitionConfigWithItemsDto> {
    const config = await this.prisma.tuitionConfig.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!config) {
      throw new NotFoundException(`Tuition Config với ID ${id} không tồn tại`);
    }

    return this.toResponseDto(TuitionConfigWithItemsDto, config);
  }

  // ==========================================
  // 4. UPDATE (Cập nhật Config + Sync Items)
  // ==========================================
  async update(id: number, updateDto: UpdateTuitionConfigDto): Promise<TuitionConfigWithItemsDto> {
    // Kiểm tra bản ghi tồn tại trước
    await this.findOne(id);

    const { items, ...configData } = updateDto;

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Nếu có mảng items truyền lên, thực hiện chiến lược xóa đi tạo lại
      if (items) {
        // Xóa sạch các items cũ thuộc config này
        await tx.tuitionConfigItem.deleteMany({
          where: { configId: id },
        });
      }

      // 2. Cập nhật thông tin cha và tạo lại items mới (nếu có)
      const updatedConfig = await tx.tuitionConfig.update({
        where: { id },
        data: {
          ...configData,
          ...(items && {
            items: {
              create: items,
            },
          }),
        },
        include: {
          items: true,
        },
      });

      // 3. LOGIC BỔ SUNG: Cập nhật lại công nợ (FeeInvoice) cho sinh viên theo định mức mới
      // Chỉ cập nhật những hóa đơn CHƯA ĐÓNG ĐỒNG NÀO (unpaid) để tránh làm sai lệch dữ liệu kế toán
      if (configData.totalAmount !== undefined || configData.minRequiredAmount !== undefined) {
        // Tìm các khóa (Batches) đang hoạt động thuộc cấu hình này
        const targetBatches = await tx.batch.findMany({
          where: {
            status: "ACTIVE",
            majorId: updatedConfig.majorId ? updatedConfig.majorId : undefined,
            id: updatedConfig.batchId ? updatedConfig.batchId : undefined,
          },
          select: { id: true },
        });

        const batchIds = targetBatches.map((b) => b.id);

        if (batchIds.length > 0) {
          await tx.feeInvoice.updateMany({
            where: {
              periodId: updatedConfig.periodId,
              status: "unpaid", // Điều kiện tiên quyết: Chưa thanh toán đồng nào
              student: {
                batchId: { in: batchIds },
                majorId: updatedConfig.majorId ? updatedConfig.majorId : undefined,
              },
            },
            data: {
              // Nếu updateDto không truyền thì giữ nguyên giá trị đã cập nhật từ updatedConfig
              totalAmount: updatedConfig.totalAmount,
              minRequiredAmount: updatedConfig.minRequiredAmount,
              remainingAmount: updatedConfig.totalAmount, // Vì chưa đóng nên nợ còn lại = tổng tiền mới
            },
          });
        }
      }

      return updatedConfig;
    });

    return this.toResponseDto(TuitionConfigWithItemsDto, result);
  }

  // ==========================================
  // 5. DELETE (Xóa Config)
  // ==========================================
  async remove(id: number): Promise<{ message: string }> {
    await this.findOne(id);

    // Sử dụng transaction để xóa sạch các item con trước rồi mới xóa cha (nếu DB chưa set Cascade Delete)
    await this.prisma.$transaction(async (tx) => {
      await tx.tuitionConfigItem.deleteMany({
        where: { configId: id },
      });
      await tx.tuitionConfig.delete({
        where: { id },
      });
    });

    return { message: `Xóa thành công Tuition Config có ID ${id}` };
  }
}
