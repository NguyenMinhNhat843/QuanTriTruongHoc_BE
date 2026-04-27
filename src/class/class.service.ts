import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ClassResponseDto } from "./class.response";
import { CreateClassDto, UpdateClassDto } from "./class.dto";
import { StudentStatus } from "../../prisma/generated/prisma/enums";

@Injectable()
export class ClassService {
  constructor(private prisma: PrismaService) {}

  // Phân lớp cho học sinh
  async assignStudentsToClass(
    majorId: number,
    batchId: number,
    maxStudents: number = 40,
  ) {
    // 1. Lấy danh sách sinh viên đủ điều kiện
    const students = await this.prisma.student.findMany({
      where: {
        majorId,
        batchId,
        classId: null, // Chưa có lớp
        status: StudentStatus.enrolled,
      },
      orderBy: { fullName: "asc" }, // Sắp xếp theo tên cho đẹp danh sách
    });

    if (students.length === 0) {
      throw new BadRequestException("Không có sinh viên nào cần phân lớp.");
    }

    // 2. Lấy thông tin Ngành và Khóa để đặt tên lớp
    const major = await this.prisma.major.findUnique({
      where: { id: majorId },
    });
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
    });

    // 3. Tính toán số lượng lớp cần tạo
    const numClasses = Math.ceil(students.length / maxStudents);
    const classLetters = ["A", "B", "C", "D", "E"]; // Hậu tố tên lớp

    for (let i = 0; i < numClasses; i++) {
      // Tạo tên lớp ví dụ: CNTTK1A
      const classCode = `${major?.majorCode}${batch?.batchCode}${classLetters[i]}`;
      const className = `Lớp ${major?.majorName} - ${batch?.batchName} ${classLetters[i]}`;

      // 4. Tạo Lớp mới trong DB
      const newClass = await this.prisma.class.create({
        data: {
          classCode,
          className,
          majorId,
          batchId,
        },
      });

      // 5. Cắt danh sách học sinh và gán vào lớp này
      const studentGroup = students.slice(
        i * maxStudents,
        (i + 1) * maxStudents,
      );
      const studentIds = studentGroup.map((s) => s.id);

      await this.prisma.student.updateMany({
        where: { id: { in: studentIds } },
        data: {
          classId: newClass.id,
          status: StudentStatus.studying, // Chuyển trạng thái sang đang học
        },
      });
    }

    return {
      message: `Đã phân ${students.length} sinh viên vào ${numClasses} lớp.`,
    };
  }

  async create(data: CreateClassDto): Promise<ClassResponseDto> {
    const { classCode, majorId, formTeacherId } = data;

    // 1. Kiểm tra mã lớp trùng lặp
    const existingClass = await this.prisma.class.findUnique({
      where: { classCode },
    });
    if (existingClass) {
      throw new ConflictException(`Mã lớp ${classCode} đã tồn tại`);
    }

    // 2. Kiểm tra Ngành học (Major) có tồn tại không
    const major = await this.prisma.major.findUnique({
      where: { id: majorId },
    });
    if (!major) {
      throw new NotFoundException(`Không tìm thấy ngành học với ID ${majorId}`);
    }

    // 3. Kiểm tra Giáo viên (Staff) có tồn tại không (nếu có cung cấp)
    if (formTeacherId) {
      const teacher = await this.prisma.staff.findUnique({
        where: { id: formTeacherId },
      });
      if (!teacher) {
        throw new NotFoundException(
          `Không tìm thấy giáo viên với ID ${formTeacherId}`,
        );
      }
    }

    try {
      const newClass = await this.prisma.class.create({
        data,
        include: {
          major: true,
          _count: { select: { courseOffers: true } },
        },
      });
      return new ClassResponseDto(newClass);
    } catch (error) {
      console.log("Lỗi khi tạo lớp:", error);
      throw new InternalServerErrorException("Lỗi hệ thống khi tạo lớp học");
    }
  }

  async findAll(): Promise<ClassResponseDto[]> {
    const classes = await this.prisma.class.findMany({
      include: {
        major: true,
        _count: { select: { courseOffers: true } },
      },
    });
    return classes.map((c) => new ClassResponseDto(c));
  }

  async findOne(id: number): Promise<ClassResponseDto> {
    const classItem = await this.prisma.class.findUnique({
      where: { id },
      include: {
        major: true,
        _count: { select: { courseOffers: true } },
      },
    });

    if (!classItem) {
      throw new NotFoundException(`Không tìm thấy lớp học với ID ${id}`);
    }
    return new ClassResponseDto(classItem);
  }

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

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.class.delete({ where: { id } });
  }
}
