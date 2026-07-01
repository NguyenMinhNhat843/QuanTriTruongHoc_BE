import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateAdmissionProfileDto,
  ResponseAdmissionProfilePaginationDto,
  SearchAdmissionProfileDto,
  UpdateAdmissionProfileDto,
} from "./dto/admission-profile.dto";
import { Prisma } from "../../prisma/generated/prisma/client";
import { plainToInstance } from "class-transformer";

@Injectable()
export class AdmissionProfileService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. CREATE
  async create(createDto: CreateAdmissionProfileDto) {
    try {
      // Chuyển đổi string gpa sang Prisma.Decimal để map đúng kiểu dữ liệu DB
      const data: Prisma.AdmissionProfileCreateInput = {
        ...createDto,
        student: { connect: { id: createDto.studentId } },
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
  async findAll(query: SearchAdmissionProfileDto) {
    const { page = 1, limit = 10, studentId } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.AdmissionProfileWhereInput = {};

    if (studentId) {
      where.studentId = Number(studentId);
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.admissionProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.admissionProfile.count({
        where,
      }),
    ]);

    return plainToInstance(ResponseAdmissionProfilePaginationDto, {
      items,
      total,
    });
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

    return await this.prisma.admissionProfile.update({
      where: { id },
      data: updateDto,
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
