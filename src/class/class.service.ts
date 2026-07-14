import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  ClassResponseDto,
  ClassResponseWithRelationsDto,
} from "./class.response";
import { CreateClassDto, SearchClassDto, UpdateClassDto } from "./class.dto";
import { plainToInstance } from "class-transformer";
import { Prisma, RoleType } from "../../prisma/generated/prisma/client";

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
      });
      return plainToInstance(ClassResponseDto, newClass);
    } catch (error) {
      console.error("Lỗi khi tạo lớp học:", error);
      throw new InternalServerErrorException("Lỗi hệ thống khi tạo lớp học");
    }
  }

  /**
   * Lấy danh sách tất cả lớp học
   */
  async findAll(
    query: SearchClassDto,
    user?: any,
  ): Promise<ClassResponseDto[]> {
    // Bắt đầu đo log với một label duy nhất
    const { classCode, majorId, formTeacherId, batchId, search } = query;

    // 1. Khởi tạo mảng conditions để nối các điều kiện bằng AND
    const andConditions: Prisma.ClassWhereInput[] = [];

    // 2. Áp dụng các bộ lọc cơ bản từ Query DTO (nếu có)
    if (majorId) andConditions.push({ majorId });
    if (batchId) andConditions.push({ batchId });
    if (formTeacherId) andConditions.push({ formTeacherId });

    if (classCode) {
      andConditions.push({
        classCode: { contains: classCode, mode: "insensitive" },
      });
    }

    if (search) {
      andConditions.push({
        OR: [
          { classCode: { contains: search, mode: "insensitive" } },
          { className: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    // 3. KIỂM TRA USER (CHỈ PHÂN QUYỀN NẾU CÓ USER TRUYỀN VÀO)
    if (user && user.role) {
      if (user.role === RoleType.teacher) {
        andConditions.push({
          OR: [
            // Điều kiện 1: Là Giáo viên chủ nhiệm của lớp đó
            { formTeacherId: user.staffId },

            // Điều kiện 2: Có dạy ít nhất 1 môn học phần (CourseOffer) thuộc lớp đó
            {
              courseOffers: {
                some: {
                  teacherId: user.staffId,
                },
              },
            },
          ],
        });
      } else if (user.role === RoleType.student) {
        // Học sinh thì chỉ thấy lớp của chính mình
        andConditions.push({
          students: {
            some: { id: user.studentId },
          },
        });
      }
      // Admin, Staff hoặc các role khác không bị gán thêm điều kiện -> Load ALL
    }

    // Gộp tất cả các điều kiện lại thành một object `where` hoàn chỉnh
    const where: Prisma.ClassWhereInput =
      andConditions.length > 0 ? { AND: andConditions } : {};

    // 4. Thực hiện truy vấn dữ liệu từ Database
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
  async findOne(id: number): Promise<ClassResponseWithRelationsDto> {
    const classItem = await this.prisma.class.findUnique({
      where: { id },
      include: {
        major: true,
        batch: true,
        _count: { select: { courseOffers: true } },
      },
    });

    // Lấy giáo viên chủ nhiệm
    const formTeacher = await this.prisma.staff.findUnique({
      where: { id: classItem?.formTeacherId || 0 },
    });

    if (!classItem) {
      throw new NotFoundException(`Không tìm thấy lớp học với ID ${id}`);
    }
    return plainToInstance(ClassResponseWithRelationsDto, {
      ...classItem,
      formTeacher: formTeacher || null,
    });
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
      return plainToInstance(ClassResponseDto, updated);
    } catch (error) {
      Logger.error("Lỗi khi cập nhật lớp học", error);
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
