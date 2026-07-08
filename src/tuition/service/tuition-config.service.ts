import { Injectable, NotFoundException } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import {
  CreateTuitionConfigDto,
  UpdateTuitionConfigDto,
  SearchTuitionConfigDto,
  TuitionConfigWithItemsDto,
} from "../dto/tuition-config.dto"; // Điều chỉnh lại đường dẫn cho đúng
import { PrismaService } from "../../prisma/prisma.service";

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
  async create(
    createDto: CreateTuitionConfigDto,
  ): Promise<TuitionConfigWithItemsDto> {
    const { items, ...configData } = createDto;

    // Chạy trong 1 Transaction để nếu lỗi tạo items thì config cũng bị rollback
    const result = await this.prisma.$transaction(async (tx) => {
      return tx.tuitionConfig.create({
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
    });

    return this.toResponseDto(TuitionConfigWithItemsDto, result);
  }

  // ==========================================
  // 2. READ ALL / SEARCH (Tìm kiếm nâng cao)
  // ==========================================
  async findAll(
    searchDto: SearchTuitionConfigDto,
  ): Promise<TuitionConfigWithItemsDto[]> {
    const where: any = {};

    // Gán điều kiện tìm kiếm động nếu có truyền lên
    if (searchDto.periodId) where.periodId = searchDto.periodId;
    if (searchDto.majorId) where.majorId = searchDto.majorId;
    if (searchDto.batchId) where.batchId = searchDto.batchId;

    const results = await this.prisma.tuitionConfig.findMany({
      where,
      include: {
        items: true,
      },
    });

    return plainToInstance(TuitionConfigWithItemsDto, results);
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
  async update(
    id: number,
    updateDto: UpdateTuitionConfigDto,
  ): Promise<TuitionConfigWithItemsDto> {
    // Kiểm tra bản ghi tồn tại trước
    await this.findOne(id);

    const { items, ...configData } = updateDto;

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Nếu có mảng items truyền lên, thực hiện chiến lược xóa đi tạo lại (hoặc bạn có thể tối ưu tùy logic)
      if (items) {
        // Xóa sạch các items cũ thuộc config này
        await tx.tuitionConfigItem.deleteMany({
          where: { configId: id },
        });
      }

      // 2. Cập nhật thông tin cha và tạo lại items mới (nếu có)
      return tx.tuitionConfig.update({
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
