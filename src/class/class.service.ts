import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ClassResponseDto } from "./class.response";
import {
  AssignStudentsToClassesDto,
  CreateClassDto,
  RequestEligibleStudents,
  UpdateClassDto,
} from "./class.dto";
import { StudentStatus } from "../../prisma/generated/prisma/enums";
import { plainToInstance } from "class-transformer";

@Injectable()
export class ClassService {
  constructor(private prisma: PrismaService) {}

  /**
   * Phân lớp tự động cho sinh viên dựa trên Ngành, Khóa và sĩ số tối đa mỗi lớp
   */
  async assignStudentsToClass(
    majorId: number,
    batchId: number,
    maxStudents: number = 40,
  ) {
    // 1. Lấy danh sách sinh viên đủ điều kiện
    const students = await this.prisma.student.findMany({
      where: {
        batchId,
        classId: null, // Chưa có lớp
        status: StudentStatus.approved,
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
    const classLetters = ["A", "B", "C", "D", "E", "F", "G", "H", "K"];

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

  /**
   * Tạo lớp học
   */
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

  /**
   * Lấy danh sách tất cả lớp học
   */
  async findAll(): Promise<ClassResponseDto[]> {
    const classes = await this.prisma.class.findMany({
      include: {
        major: true,
        batch: true,
        _count: { select: { courseOffers: true } },
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

  /**
   * Phân lớp tự động cho sinh viên chính thức dựa trên Ngành, Khóa và sĩ số tối đa mỗi lớp
   */
  async assignStudentsToClasses(body: AssignStudentsToClassesDto) {
    const { batchId, studentsPerClass = 40 } = body;
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
    });
    const majorId = batch!.majorId!;

    // 1. Lấy danh sách học sinh thuộc ngành, khóa đó, đang trạng thái 'studying' và chưa có lớp
    const students = await this.prisma.student.findMany({
      where: {
        batchId,
        classId: null, // Chưa có lớp
        status: StudentStatus.studying, // Đã đóng tiền và chuyển sang trạng thái đang học
        batch: {
          curriculum: {
            majorId: majorId, // Đảm bảo sinh viên thuộc đúng Ngành cần phân lớp
          },
        },
      },
      orderBy: { fullName: "asc" }, // Sắp xếp theo tên alpha-b
    });

    if (students.length === 0) {
      throw new BadRequestException("Không có sinh viên nào cần phân lớp.");
    }

    // 2. Lấy thông tin Batch và Major để làm tiền tố đặt mã lớp (Ví dụ: CNTTK20)
    const [major] = await Promise.all([
      this.prisma.batch.findUnique({ where: { id: batchId } }),
      this.prisma.major.findUnique({ where: { id: majorId } }),
    ]);

    if (!batch || !major) {
      throw new NotFoundException(
        "Không tìm thấy thông tin Khóa hoặc Ngành học hợp lệ.",
      );
    }

    // 3. Tính số lượng lớp cần tạo dựa trên sĩ số tối đa mỗi lớp
    const numClasses = Math.ceil(students.length / studentsPerClass);

    // Tạo hậu tố tên lớp động phòng trường hợp vượt quá mảng chữ cái cố định
    const getClassSuffix = (index: number) => {
      const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
      return letters[index] || `Lớp-${index + 1}`;
    };

    // 4. Chạy Transaction để thực hiện tạo lớp và phân phối sinh viên
    return await this.prisma.$transaction(async (tx) => {
      const createdClasses: {
        classId: number;
        classCode: string;
        assignedCount: number;
      }[] = [];

      for (let i = 0; i < numClasses; i++) {
        const suffix = getClassSuffix(i);

        // Định dạng mã lớp: Ví dụ ngành CNTT, khóa K26 -> CNTTK26A
        const classCode = `${batch.batchCode}${suffix}`
          .toUpperCase()
          .replace(/\s+/g, "");
        const className = `${batch.batchCode} ${suffix}`;

        // Kiểm tra xem mã lớp này đã vô tình được tạo trước đó chưa (tránh lỗi trùng Unique classCode)
        let currentClass = await tx.class.findUnique({
          where: { classCode },
        });

        // Xác định nhóm sinh viên sẽ vào lớp này thông qua hàm slice mảng sinh viên tổng
        const startIdx = i * studentsPerClass;
        const endIdx = startIdx + studentsPerClass;
        const studentsForThisClass = students.slice(startIdx, endIdx);

        // Nếu lớp chưa tồn tại thì tiến hành tạo lớp mới
        if (!currentClass) {
          currentClass = await tx.class.create({
            data: {
              classCode,
              className,
              majorId,
              batchId,
              maxStudents: studentsPerClass,
              currentSize: studentsForThisClass.length, // Cập nhật sĩ số thực tế luôn
              status: "active",
            },
          });
        } else {
          // Nếu lớp đã tồn tại từ trước, cộng dồn sĩ số mới vào sĩ số hiện tại
          await tx.class.update({
            where: { id: currentClass.id },
            data: {
              currentSize: { increment: studentsForThisClass.length },
            },
          });
        }

        // Cập nhật classId cho nhóm sinh viên thuộc lớp này
        const studentIdsForClass = studentsForThisClass.map((s) => s.id);
        await tx.student.updateMany({
          where: {
            id: { in: studentIdsForClass },
          },
          data: {
            classId: currentClass.id, // Gắn ID lớp cho sinh viên
          },
        });

        createdClasses.push({
          classId: currentClass.id,
          classCode: currentClass.classCode,
          assignedCount: studentsForThisClass.length,
        });
      }

      return {
        message: `Phân lớp thành công cho ${students.length} sinh viên vào ${createdClasses.length} lớp.`,
        details: createdClasses,
      };
    });
  }

  /**
   * Lấy danh sách sinh viên đủ điều kiện phân lớp
   * Theo khóa đào tạo, ngành, học sinh phải đóng học phí rồi
   */
  async getEligibleStudentsForAssignment(query: RequestEligibleStudents) {
    const { batchId } = query;
    const students = await this.prisma.student.findMany({
      where: {
        status: StudentStatus.studying,
        classId: null,
        batchId: batchId ? batchId : undefined,
      },
      include: {
        application: {
          include: {
            admission: true, // Lấy thông tin đợt tuyển sinh từ quan hệ Application
          },
        },
      },
      orderBy: { fullName: "asc" },
    });

    return {
      // Thống kê tổng số sinh viên đủ điều kiện
      totalEligible: students.length,
      students: students.map((s) => ({
        id: s.id,
        studentCode: s.studentCode,
        fullName: s.fullName,
        admissionName: s.application?.admission?.name || "Không rõ đợt",
      })),
    };
  }
}
