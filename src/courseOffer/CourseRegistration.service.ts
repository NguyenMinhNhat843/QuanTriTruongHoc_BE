import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service"; // Thay đổi đường dẫn tùy dự án của bạn
import { CreateCourseRegistrationDto } from "./CourseRegistration.dto";

@Injectable()
export class CourseRegistrationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 1. Đăng ký lớp học phần (Create với Transaction an toàn sĩ số)
   */
  async create(dto: CreateCourseRegistrationDto) {
    const { studentId, courseOfferId, note } = dto;

    // Sử dụng transaction để xử lý đồng thời (Race Condition) và bảo toàn dữ liệu sĩ số
    return await this.prisma.$transaction(async (tx) => {
      // Kiểm tra lớp học phần có tồn tại hay không
      const courseOffer = await tx.courseOffer.findUnique({
        where: { id: courseOfferId },
      });

      if (!courseOffer) {
        throw new NotFoundException(
          `Lớp học phần với ID ${courseOfferId} không tồn tại.`,
        );
      }

      // Kiểm tra trạng thái lớp học phần (Chỉ cho phép đăng ký khi trạng thái là 'open')
      if (courseOffer.status !== "open") {
        throw new BadRequestException(
          `Không thể đăng ký. Lớp học phần đang ở trạng thái: ${courseOffer.status}.`,
        );
      }

      // Kiểm tra thời gian đăng ký (Nếu hệ thống có cấu hình ngày bắt đầu và kết thúc)
      const now = new Date();
      if (
        courseOffer.registrationStart &&
        now < courseOffer.registrationStart
      ) {
        throw new BadRequestException(
          "Chưa đến thời gian mở đăng ký cho lớp học phần này.",
        );
      }
      if (courseOffer.registrationEnd && now > courseOffer.registrationEnd) {
        throw new BadRequestException(
          "Hạn đăng ký lớp học phần này đã kết thúc.",
        );
      }

      // Kiểm tra sĩ số lớp hiện tại xem đã đầy chưa
      if (courseOffer.currentStudents >= courseOffer.maxStudents) {
        throw new BadRequestException(
          `Lớp học phần này đã đạt giới hạn sĩ số tối đa (${courseOffer.maxStudents}).`,
        );
      }

      // Kiểm tra xem sinh viên này đã đăng ký học phần này từ trước chưa (Tránh dính lỗi trùng @@unique)
      const existingRegistration = await tx.courseRegistration.findUnique({
        where: {
          studentId_courseOfferId: { studentId, courseOfferId },
        },
      });

      if (existingRegistration) {
        throw new ConflictException(
          "Sinh viên này đã đăng ký lớp học phần này trước đó.",
        );
      }

      // Thực hiện tạo bản ghi Đăng ký học phần
      const registration = await tx.courseRegistration.create({
        data: {
          studentId,
          courseOfferId,
          note,
          status: "registered", // Giá trị mặc định ban đầu
        },
      });

      // Cập nhật tăng sĩ số lớp học phần lên 1 đơn vị
      await tx.courseOffer.update({
        where: { id: courseOfferId },
        data: {
          currentStudents: {
            increment: 1,
          },
        },
      });

      return registration;
    });
  }

  /**
   * 2. Lấy toàn bộ danh sách đăng ký học phần
   */
  async getAll() {
    return await this.prisma.courseRegistration.findMany({
      include: {
        student: {
          select: {
            id: true,
            // Thêm các trường tối giản của Student bạn muốn hiện ở đây, ví dụ: studentCode, fullName
          },
        },
        courseOffer: {
          select: {
            id: true,
            courseCode: true,
            courseName: true,
            status: true,
          },
        },
      },
      orderBy: {
        registeredAt: "desc", // Sắp xếp lượt đăng ký mới nhất lên đầu
      },
    });
  }

  /**
   * 3. Lấy chi tiết một bản ghi đăng ký theo ID
   */
  async getDetail(id: number) {
    const registration = await this.prisma.courseRegistration.findUnique({
      where: { id },
      include: {
        student: true, // Lấy toàn bộ thông tin sinh viên
        courseOffer: {
          include: {
            subject: true, // Đi kèm thông tin môn học
            semester: true, // Đi kèm thông tin học kỳ
          },
        },
      },
    });

    if (!registration) {
      throw new NotFoundException(
        `Không tìm thấy bản ghi đăng ký học phần với ID ${id}`,
      );
    }

    return registration;
  }
}
