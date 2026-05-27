import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ClassResponseDto } from "./class.response";
import { CreateClassDto, SearchClassDto, UpdateClassDto } from "./class.dto";
import { plainToInstance } from "class-transformer";
import { Prisma } from "../../prisma/generated/prisma/client";

@Injectable()
export class ClassService {
  constructor(private prisma: PrismaService) {}

  /**
   * Kiểm tra trùng lặp mã lớp
   */
  async checkExistingClassCode(classCode: string) {
    const client = this.prisma;
    const existing = await client.class.findUnique({ where: { classCode } });
    if (existing) {
      throw new ConflictException(`Mã lớp ${classCode} đã tồn tại`);
    }
    return existing;
  }

  /**
   * Kiểm tra Ngành học có tồn tại không
   */
  async validateMajorExist(majorId: number) {
    const client = this.prisma;
    const major = await client.major.findUnique({ where: { id: majorId } });
    if (!major) {
      throw new NotFoundException(`Không tìm thấy ngành học với ID ${majorId}`);
    }
    return major;
  }

  /**
   * Kiểm tra Giảng viên chủ nhiệm có tồn tại không
   */
  async validateTeacherExist(formTeacherId: number) {
    const teacher = await this.prisma.staff.findUnique({
      where: { id: formTeacherId },
    });
    if (!teacher) {
      throw new NotFoundException(
        `Không tìm thấy giáo viên với ID ${formTeacherId}`,
      );
    }
    return teacher;
  }

  /**
   * Tạo lớp học
   */
  async create(
    data: CreateClassDto,
    tx?: Prisma.TransactionClient,
  ): Promise<ClassResponseDto> {
    const client = tx || this.prisma;
    const { classCode, majorId, formTeacherId } = data;

    await this.checkExistingClassCode(classCode);
    await this.validateMajorExist(majorId);
    if (formTeacherId) {
      await this.validateTeacherExist(formTeacherId);
    }

    try {
      const newClass = await client.class.create({
        data,
        include: {
          _count: { select: { courseOffers: true } },
        },
      });
      return new ClassResponseDto(newClass);
    } catch (error) {
      console.error("Lỗi khi tạo lớp học:", error);
      throw new InternalServerErrorException("Lỗi hệ thống khi tạo lớp học");
    }
  }

  /**
   * Lấy danh sách tất cả lớp học
   */
  async findAll(query: SearchClassDto): Promise<ClassResponseDto[]> {
    const { classCode, majorId } = query;
    const where: Prisma.ClassWhereInput = {};

    if (majorId) {
      where.majorId = majorId;
    }

    if (classCode) {
      where.OR = [
        {
          classCode: {
            contains: classCode,
            mode: "insensitive",
          },
        },
        {
          className: {
            contains: classCode,
            mode: "insensitive",
          },
        },
      ];
    }

    const classes = await this.prisma.class.findMany({
      where,
      include: {
        major: true,
        batch: true,
        _count: { select: { courseOffers: true } },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return plainToInstance(ClassResponseDto, classes);
  }

  /**
   * Lấy thông tin một lớp học theo ID
   */
  async findOne(id: number): Promise<ClassResponseDto> {
    const classItem = await this.prisma.class.findUnique({
      where: { id },
      include: {
        major: true,
        batch: true,
        _count: { select: { courseOffers: true } },
      },
    });

    if (!classItem) {
      throw new NotFoundException(`Không tìm thấy lớp học với ID ${id}`);
    }
    return new ClassResponseDto(classItem);
  }

  /**
   * Cập nhật thông tin lớp học
   */
  async update(id: number, data: UpdateClassDto): Promise<ClassResponseDto> {
    await this.findOne(id); // Kiểm tra tồn tại

    if (data.majorId) {
      const major = await this.prisma.major.findUnique({
        where: { id: data.majorId },
      });
      if (!major) throw new NotFoundException("Ngành học không tồn tại");
    }

    try {
      const updated = await this.prisma.class.update({
        where: { id },
        data,
        include: { major: true },
      });
      return new ClassResponseDto(updated);
    } catch (error) {
      console.log("Lỗi khi cập nhật lớp:", error);
      throw new InternalServerErrorException("Lỗi khi cập nhật lớp học");
    }
  }

  /**
   * Xóa 1 lớp học
   */
  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.class.delete({ where: { id } });
  }
}
