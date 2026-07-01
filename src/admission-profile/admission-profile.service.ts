import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateAdmissionProfileDto,
  UpdateAdmissionProfileDto,
} from "./dto/admission-profile.dto";
import { Prisma } from "../../prisma/generated/prisma/client";

@Injectable()
export class AdmissionProfileService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. CREATE
  async create(createDto: CreateAdmissionProfileDto) {
    try {
      // Chuyển đổi string gpa sang Prisma.Decimal để map đúng kiểu dữ liệu DB
      const data: Prisma.AdmissionProfileCreateInput = {
        ...createDto,
        student: { connect: { id: createDto.studentId } }, // Nếu schema cấu trúc quan hệ với model Student
        gpa6: new Prisma.Decimal(createDto.gpa6),
        gpa7: new Prisma.Decimal(createDto.gpa7),
        gpa8: new Prisma.Decimal(createDto.gpa8),
        gpa9: new Prisma.Decimal(createDto.gpa9),
      };

      // Xóa bớt thuộc tính studentId dạng nguyên bản cũ vì đã map vào connect nested write ở trên
      delete (data as any).studentId;

      return await this.prisma.admissionProfile.create({ data });
    } catch (error) {
      throw new BadRequestException("Học sinh này đã có hồ sơ tuyển sinh rồi.");
      throw error;
    }
  }

  // 2. READ ALL (Có phân trang cơ bản)
  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.admissionProfile.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.admissionProfile.count(),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // 3. READ ONE
  async findOne(id: number) {
    const profile = await this.prisma.admissionProfile.findUnique({
      where: { id },
    });

    if (!profile) {
      throw new NotFoundException(
        `Không tìm thấy hồ sơ tuyển sinh với ID ${id}`,
      );
    }

    return profile;
  }

  // 4. UPDATE
  async update(id: number, updateDto: UpdateAdmissionProfileDto) {
    // Kiểm tra xem bản ghi có tồn tại không trước khi update
    await this.findOne(id);

    const updateData: Prisma.AdmissionProfileUpdateInput = {
      ...updateDto,
    } as any;

    // Convert ngược các trường gpa nếu Client có truyền lên để cập nhật
    if (updateDto.gpa6) updateData.gpa6 = new Prisma.Decimal(updateDto.gpa6);
    if (updateDto.gpa7) updateData.gpa7 = new Prisma.Decimal(updateDto.gpa7);
    if (updateDto.gpa8) updateData.gpa8 = new Prisma.Decimal(updateDto.gpa8);
    if (updateDto.gpa9) updateData.gpa9 = new Prisma.Decimal(updateDto.gpa9);

    return await this.prisma.admissionProfile.update({
      where: { id },
      data: updateData,
    });
  }

  // 5. DELETE
  async remove(id: number) {
    await this.findOne(id);

    return await this.prisma.admissionProfile.delete({
      where: { id },
    });
  }
}
