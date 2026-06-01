import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import {
  CreateStudentDto,
  SearchStudentDto,
  UpdateStudentDto,
} from "./student.dto.js";
import { StudentResponseDto } from "./student.response.js";
import {
  Prisma,
  RoleType,
  StudentStatus,
} from "../../prisma/generated/prisma/client.js";
import { generateId } from "../utils/generateId.js";
import * as bcrypt from "bcryptjs";
import { plainToInstance } from "class-transformer";

@Injectable()
export class StudentService {
  constructor(private prisma: PrismaService) {}

  /**
   * Tạo mới một sinh viên
   */
  async createStudent(data: CreateStudentDto): Promise<StudentResponseDto> {
    const existingStudent = await this.prisma.student.findFirst({
      where: { identityNumber: data.identityNumber },
    });
    if (existingStudent) {
      throw new ConflictException(
        "Chứng minh thư này đã tồn tại trên hệ thống",
      );
    }

    const student = await this.prisma.student.create({
      data: {
        ...data,
        studentCode: `S${generateId()}`,
        dob: data.dob ? new Date(data.dob) : null,
      },
    });

    return plainToInstance(StudentResponseDto, student);
  }

  async deleteStudentById(id: number) {
    return await this.prisma.student.delete({
      where: { id },
    });
  }

  /**
   * Tạo nhiều sinh viên
   */
  async createManyStudents(data: CreateStudentDto[]) {
    const timestampPart = Date.now().toString().slice(-7);

    // Hàm helper để chuẩn hóa chuỗi ngày tháng về múi giờ VN (+07:00)
    const formatToVnTimezone = (dateInput: any) => {
      if (!dateInput) return null;

      // Nếu là chuỗi, lấy 10 ký tự đầu (YYYY-MM-DD)
      const dateStr =
        typeof dateInput === "string" ? dateInput.split("T")[0] : dateInput;

      // Ép về định dạng ISO chuẩn múi giờ +07:00
      return new Date(`${dateStr}T00:00:00.000+07:00`);
    };

    const createdStudents = await this.prisma.student.createMany({
      data: data.map((item, i) => {
        const randomPart = Math.floor(10 + Math.random() * 90).toString();

        return {
          ...item,
          // Ép kiểu Date chính xác cho ngày sinh và các ngày liên quan
          dob: formatToVnTimezone(item.dob),
          enrollmentDate: formatToVnTimezone(item.enrollmentDate),
          graduationDate: formatToVnTimezone(item.graduationDate),

          studentCode: `S${timestampPart}${randomPart}${i}`,
        };
      }),
      skipDuplicates: true,
    });

    return {
      message: `Đã tạo thành công ${createdStudents.count} sinh viên`,
      status: true,
    };
  }

  /**
   * Tìm sinh viên theo mã sinh viên
   */
  async findStudentByStudentCode(
    studentCode: string,
  ): Promise<StudentResponseDto> {
    const student = await this.prisma.student.findUnique({
      where: { studentCode },
      include: {
        user: true,
        batch: true,
        class: true,
      },
    });
    if (!student) {
      throw new NotFoundException("Không tìm thấy sinh viên");
    }
    return plainToInstance(StudentResponseDto, student);
  }

  /**
   * Cập nhật thông tin sinh viên
   */
  async updateStudent(
    id: number,
    data: UpdateStudentDto,
  ): Promise<StudentResponseDto> {
    const studentExists = await this.prisma.student.findUnique({
      where: { id },
    });

    if (!studentExists) {
      throw new NotFoundException("Không tìm thấy sinh viên cần cập nhật");
    }

    const updatedStudent = await this.prisma.student.update({
      where: { id },
      data,
      include: {
        user: true,
      },
    });

    return plainToInstance(StudentResponseDto, updatedStudent);
  }

  /**
   * Duyệt hồ sơ và cấp tài khoản cho sinh viên
   */
  async approveStudent(id: number): Promise<StudentResponseDto> {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!student) {
      throw new NotFoundException("Không tìm thấy hồ sơ sinh viên");
    }

    if (student.userId || student.user) {
      throw new BadRequestException(
        "Sinh viên này đã được cấp tài khoản trước đó",
      );
    }

    const defaultPassword = "123456";
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(defaultPassword, salt);

    try {
      const updatedStudent = await this.prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            username: student.studentCode,
            passwordHash: passwordHash,
            role: RoleType.student,
            studentId: student.id,
            isActive: true,
          },
        });

        // Cập nhật lại thông tin trong bảng Student
        return await tx.student.update({
          where: { id: student.id },
          data: {
            userId: newUser.id,
            status: StudentStatus.studying, // Chuyển sang trạng thái đang theo học
          },
          include: {
            user: true, // Để map dữ liệu vào Response DTO
          },
        });
      });

      return plainToInstance(StudentResponseDto, updatedStudent);
    } catch (error) {
      // Xử lý các lỗi phát sinh (ví dụ trùng username trong bảng User)
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new BadRequestException(
            "Mã sinh viên đã được sử dụng để tạo tài khoản trước đó",
          );
        }
      }
      throw new InternalServerErrorException(
        "Có lỗi xảy ra trong quá trình duyệt hồ sơ",
      );
    }
  }

  async searchStudents(query: SearchStudentDto) {
    const {
      page = 1,
      limit = 1000,
      keyword,
      status,
      classId,
      fromDate,
      toDate,
      sortBy = "createdAt",
      sortOrder = "desc",
      studentCode,
    } = query;

    const skip = (page - 1) * limit;

    // 1. Xây dựng điều kiện lọc (Where Clause)
    const where: Prisma.StudentWhereInput = {
      AND: [
        // Lọc theo keyword (tìm trong mã SV, số CCCD của Student hoặc tên, email của User)
        keyword
          ? {
              OR: [
                { studentCode: { contains: keyword, mode: "insensitive" } },
                { identityNumber: { contains: keyword, mode: "insensitive" } },
                { email: { contains: keyword, mode: "insensitive" } },
                { fullName: { contains: keyword, mode: "insensitive" } },
                { phone: { contains: keyword, mode: "insensitive" } },
              ],
            }
          : {},

        // Lọc theo trạng thái học tập
        status ? { status } : {},

        // Lọc theo lớp
        classId ? { classId } : {},

        // Lọc theo khoảng ngày nhập học (enrollmentDate)
        fromDate || toDate
          ? {
              enrollmentDate: {
                ...(fromDate && { gte: new Date(fromDate) }),
                ...(toDate && { lte: new Date(toDate) }),
              },
            }
          : {},

        // Lọc theo mã sinh viên
        studentCode
          ? { studentCode: { contains: studentCode, mode: "insensitive" } }
          : {},
      ],
    };

    // 2. Thực thi truy vấn đồng thời để tối ưu hiệu suất
    const [total, items] = await Promise.all([
      this.prisma.student.count({ where }),
      this.prisma.student.findMany({
        where,
        include: {
          user: true,
          batch: true,
          class: {
            select: {
              classCode: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: sortBy.includes(".")
          ? { [sortBy.split(".")[0]]: { [sortBy.split(".")[1]]: sortOrder } }
          : { [sortBy]: sortOrder },
      }),
    ]);
    console.log(
      "🚀 ~ file: student.service.ts:263 ~ StudentService ~ searchStudents ~ items:",
      total,
    );

    // 3. Trả về kết quả theo format chung
    return items.map((item) => plainToInstance(StudentResponseDto, item));
  }
}
