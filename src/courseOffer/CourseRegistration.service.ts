import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service"; // Thay đổi đường dẫn tùy dự án của bạn
import { SaveGradesDto } from "./CourseRegistration.dto";
import { Prisma } from "../../prisma/generated/prisma/client";

@Injectable()
export class CourseRegistrationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo mới toàn bộ bảng điểm cho 1 classSubject
   */
  async createGradeTable(
    classId: number,
    classSubjectId: number,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;

    // Lấy danh sách sinh viên trong class
    const students = await client.student.findMany({
      where: {
        classId,
      },
    });

    // Tạo điểm cho từng sinh viên
    const createGrades = await client.courseRegistration.createMany({
      data: students.map((s) => ({
        studentId: s.id,
        courseOfferId: classSubjectId,
      })),
      skipDuplicates: true,
    });

    return createGrades;
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

  /**
   * Lưu bảng điểm
   */
  async saveGradeTable(data: SaveGradesDto) {
    const { classSubjectId, grades } = data;

    if (!grades || grades.length === 0) {
      return { success: true, count: 0 };
    }

    const updatePromises = grades.map((grade) => {
      return this.prisma.courseRegistration.updateMany({
        where: {
          courseOfferId: classSubjectId,
          studentId: grade.studentId,
        },
        data: {
          kttx1: grade.kttx1,
          kttx2: grade.kttx2,
          kttx3: grade.kttx3,
          ktdk1: grade.ktdk1,
          ktdk2: grade.ktdk2,
          ktdk3: grade.ktdk3,
          ktdk4: grade.ktdk4,
          diemKiemTra1: grade.diemKiemTra1,
          diemKiemTra2: grade.diemKiemTra2,
          diemTB: grade.diemTB,
          diemTongKet1: grade.diemTongKet1,
          diemTongKet2: grade.diemTongKet2,
          note: grade.note,
        },
      });
    });

    // 3. Thực thi đồng loạt tất cả các lệnh update
    const results = await Promise.all(updatePromises);

    return {
      success: true,
      message: `Đã cập nhật điểm thành công cho ${results.length} học sinh.`,
    };
  }
}
