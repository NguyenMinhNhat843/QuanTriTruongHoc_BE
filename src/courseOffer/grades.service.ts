import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SaveGradesDto } from "./grades.dto";
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
          },
        },
        courseOffer: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
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
        student: true,
        courseOffer: {
          include: {
            subject: true,
            semester: true,
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
   * Hàm helper quy đổi điểm hệ 10 sang điểm chữ theo tiêu chuẩn chung
   */
  private calculateRatingGrade(
    diemTK: number | null | undefined,
  ): string | null {
    if (diemTK === null || diemTK === undefined) return null;

    if (diemTK >= 8.5) return "A";
    if (diemTK >= 7.0) return "B";
    if (diemTK >= 5.5) return "C";
    if (diemTK >= 4.0) return "D";
    return "F";
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
          rating: this.calculateRatingGrade(grade.diemTongKet2),
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
