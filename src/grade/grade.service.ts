import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service"; // Chỉnh đường dẫn tùy theo cấu trúc dự án của bạn
import { plainToInstance } from "class-transformer";
import { GradeComponentDto } from "./grade.response";
import { CreateGradeComponentDto, UpdateGradeComponentDto } from "./grade.dto";

@Injectable()
export class GradeComponentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 1. CREATE - Tạo cấu hình loại điểm mới
   */
  async create(dto: CreateGradeComponentDto): Promise<GradeComponentDto> {
    const newComponent = await this.prisma.gradeComponent.create({
      data: {
        name: dto.name,
      },
    });

    return plainToInstance(GradeComponentDto, newComponent, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * 2. GET ALL - Lấy danh sách tất cả loại điểm
   */
  async findAll(): Promise<GradeComponentDto[]> {
    const components = await this.prisma.gradeComponent.findMany({
      orderBy: { id: "asc" },
    });
    console.log(
      plainToInstance(GradeComponentDto, components, {
        excludeExtraneousValues: true,
      }),
    );

    return plainToInstance(GradeComponentDto, components);
  }

  /**
   * 3. GET DETAIL - Xem chi tiết theo ID
   */
  async findOne(id: number): Promise<GradeComponentDto> {
    const component = await this.prisma.gradeComponent.findUnique({
      where: { id },
    });

    if (!component) {
      throw new NotFoundException(
        `Không tìm thấy cấu hình loại điểm với ID #${id}`,
      );
    }

    return plainToInstance(GradeComponentDto, component, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * 4. UPDATE - Chỉnh sửa thông tin loại điểm
   */
  async update(
    id: number,
    dto: UpdateGradeComponentDto,
  ): Promise<GradeComponentDto> {
    // Kiểm tra sự tồn tại của bản ghi trước khi update
    const existing = await this.prisma.gradeComponent.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(
        `Không tìm thấy cấu hình loại điểm với ID #${id}`,
      );
    }

    const updatedComponent = await this.prisma.gradeComponent.update({
      where: { id },
      data: {
        name: dto.name ?? existing.name,
      },
    });

    return plainToInstance(GradeComponentDto, updatedComponent, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * 5. DELETE - Xóa cấu hình loại điểm
   */
  async remove(id: number): Promise<{ message: string; deletedId: number }> {
    const existing = await this.prisma.gradeComponent.findUnique({
      where: { id },
      include: {
        _count: {
          select: { gradeEntries: true }, // Đếm xem đã có bảng điểm nào đang dùng cấu hình này chưa
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(
        `Không tìm thấy cấu hình loại điểm với ID #${id}`,
      );
    }

    // Ràng buộc bảo vệ tính toàn vẹn dữ liệu (Foreign Key Constraint)
    if (existing._count.gradeEntries > 0) {
      throw new BadRequestException(
        `Không thể xóa loại điểm này vì đang có ${existing._count.gradeEntries} đầu điểm của sinh viên liên kết.`,
      );
    }

    await this.prisma.gradeComponent.delete({
      where: { id },
    });

    return {
      message: `Xóa thành công cấu hình đầu điểm #${id}`,
      deletedId: id,
    };
  }
}
