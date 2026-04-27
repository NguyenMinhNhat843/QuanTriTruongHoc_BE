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
import { ResponsePagination } from "../common/common.response.js";
import { generateId } from "../utils/generateId.js";
import * as bcrypt from "bcryptjs";

@Injectable()
export class StudentService {
  constructor(private prisma: PrismaService) {}

  // api phân lớp

  /**
   * Tạo mới một sinh viên
   */
  async createStudent(data: CreateStudentDto): Promise<StudentResponseDto> {
    // 1. Kiểm tra mã sinh viên đã tồn tại chưa
    const existingStudent = await this.prisma.student.findFirst({
      where: { identityNumber: data.identityNumber },
    });
    if (existingStudent) {
      throw new ConflictException(
        "Chứng minh thư này đã tồn tại trên hệ thống",
      );
    }

    // 3. Tạo Student
    const student = await this.prisma.student.create({
      data: {
        ...data,
        studentCode: `S${generateId()}`,
        dob: data.dob ? new Date(data.dob) : null,
      },
    });

    return new StudentResponseDto(student);
  }

  /**
   * Cập nhật thông tin sinh viên
   */
  async updateStudent(
    id: number,
    data: UpdateStudentDto,
  ): Promise<StudentResponseDto> {
    // 1. Kiểm tra sinh viên có tồn tại không
    const studentExists = await this.prisma.student.findUnique({
      where: { id },
    });

    if (!studentExists) {
      throw new NotFoundException("Không tìm thấy sinh viên cần cập nhật");
    }

    // 3. Tiến hành cập nhật
    const updatedStudent = await this.prisma.student.update({
      where: { id },
      data: {
        classId: data.classId,
        enrollmentDate: data.enrollmentDate,
        status: data.status,
        parentName: data.parentName,
        parentPhone: data.parentPhone,
        identityNumber: data.identityNumber,
        // Lưu ý: Thường không cập nhật userId để giữ toàn vẹn dữ liệu
      },
      include: {
        user: true,
      },
    });

    return new StudentResponseDto(updatedStudent);
  }

  /**
   * Duyệt hồ sơ và cấp tài khoản cho sinh viên
   */
  async approveStudent(id: number): Promise<StudentResponseDto> {
    // 1. Kiểm tra hồ sơ sinh viên có tồn tại không
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!student) {
      throw new NotFoundException("Không tìm thấy hồ sơ sinh viên");
    }

    // 2. Kiểm tra xem đã có tài khoản chưa hoặc trạng thái có hợp lệ để duyệt không
    if (student.userId || student.user) {
      throw new BadRequestException(
        "Sinh viên này đã được cấp tài khoản trước đó",
      );
    }

    // Bạn có thể thêm logic chỉ cho phép duyệt khi trạng thái là 'pending' hoặc 'approved'
    // if (student.status === StudentStatus.rejected) {
    //   throw new BadRequestException("Không thể duyệt hồ sơ đã bị từ chối");
    // }

    // 3. Chuẩn bị thông tin tài khoản mặc định
    const defaultPassword = "123456";
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(defaultPassword, salt);

    try {
      // 4. Chạy Transaction để đảm bảo tạo User và Update Student cùng lúc
      const updatedStudent = await this.prisma.$transaction(async (tx) => {
        // Tạo User mới (Username = studentCode)
        const newUser = await tx.user.create({
          data: {
            username: student.studentCode,
            passwordHash: passwordHash,
            role: RoleType.student,
            userId: `U${generateId()}`,
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

      return new StudentResponseDto(updatedStudent);
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

  async searchStudents(
    query: SearchStudentDto,
  ): Promise<ResponsePagination<StudentResponseDto>> {
    const {
      page = 1,
      limit = 10,
      keyword,
      status,
      classId,
      fromDate,
      toDate,
      sortBy = "createdAt",
      sortOrder = "desc",
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
      ],
    };

    // 2. Thực thi truy vấn đồng thời để tối ưu hiệu suất
    const [total, items] = await Promise.all([
      this.prisma.student.count({ where }),
      this.prisma.student.findMany({
        where,
        include: {
          user: true, // Quan trọng: include để StudentResponseDto có dữ liệu map
        },
        skip,
        take: limit,
        orderBy: sortBy.includes(".")
          ? { [sortBy.split(".")[0]]: { [sortBy.split(".")[1]]: sortOrder } }
          : { [sortBy]: sortOrder },
      }),
    ]);

    // 3. Trả về kết quả theo format chung
    return {
      data: items.map((item) => new StudentResponseDto(item)),
      meta: {
        total,
      },
    };
  }
}
