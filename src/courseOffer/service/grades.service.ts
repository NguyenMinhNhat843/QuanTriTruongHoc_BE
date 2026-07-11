import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { SaveGradesDto } from "../dto/grades.dto";
import { Prisma } from "../../../prisma/generated/prisma/client";

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
    const createGrades = await client.gradeStudent.createMany({
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
    return await this.prisma.gradeStudent.findMany({
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
    const grade = await this.prisma.gradeStudent.findUnique({
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

    if (!grade) {
      throw new NotFoundException(`Không tìm thấy bản ghi điểm với ID ${id}`);
    }

    return grade;
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
      return this.prisma.gradeStudent.updateMany({
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

  async getAcademicSummaryWidget(userId: number) {
    try {
      // 1. Tìm hồ sơ Student tương ứng với User
      const student = await this.prisma.student.findUnique({
        where: { userId: userId },
        select: { id: true, majorId: true, classId: true },
      });

      if (!student) {
        throw new NotFoundException("Không tìm thấy hồ sơ học sinh.");
      }

      const studentId = student.id;

      // 2. Lấy toàn bộ danh sách điểm kèm thông tin môn học và học kỳ
      const grades = await this.prisma.gradeStudent.findMany({
        where: { studentId: studentId },
        include: {
          courseOffer: {
            include: {
              subject: true,
              semester: true,
            },
          },
        },
        orderBy: {
          courseOffer: {
            semester: {
              startDate: "asc",
            },
          },
        },
      });

      // 3. Khởi tạo các biến tính toán tích lũy toàn khóa
      let totalWeightedScore = 0;
      let totalCreditsForGpa = 0;
      let totalAccumulatedCredits = 0;
      let completedSubjectsCount = 0;

      // Định nghĩa kiểu dữ liệu cho Map gom nhóm học kỳ
      const semesterDataMap: Record<
        string,
        {
          semesterName: string;
          totalWeightedScore: number;
          totalCredits: number;
        }
      > = {};

      // 4. Duyệt qua danh sách điểm để tính toán
      grades.forEach((grade) => {
        const finalGrade = grade.diemTongKet2 ?? grade.diemTB;
        const credits = grade.courseOffer.subject.credits || 0;

        const semesterId = grade.courseOffer.semester.id;
        const semesterName = grade.courseOffer.semester.name;

        if (!semesterDataMap[semesterId]) {
          semesterDataMap[semesterId] = {
            semesterName: semesterName,
            totalWeightedScore: 0,
            totalCredits: 0,
          };
        }

        if (finalGrade !== null && finalGrade !== undefined) {
          completedSubjectsCount++;

          totalWeightedScore += finalGrade * credits;
          totalCreditsForGpa += credits;

          semesterDataMap[semesterId].totalWeightedScore +=
            finalGrade * credits;
          semesterDataMap[semesterId].totalCredits += credits;

          if (finalGrade >= 5.0) {
            totalAccumulatedCredits += credits;
          }
        }
      });

      // 5. Tính toán GPA Tích lũy tổng và định dạng lại mảng học kỳ
      const cumulativeGpa =
        totalCreditsForGpa > 0
          ? parseFloat((totalWeightedScore / totalCreditsForGpa).toFixed(2))
          : 0;

      const semesterHistory = Object.keys(semesterDataMap).map((key) => {
        const sem = semesterDataMap[key];
        return {
          semesterName: sem.semesterName,
          gpa:
            sem.totalCredits > 0
              ? parseFloat(
                  (sem.totalWeightedScore / sem.totalCredits).toFixed(2),
                )
              : 0,
          credits: sem.totalCredits,
        };
      });

      // Trả về data raw (Controller sẽ bọc wrapper success: true sau)
      return {
        summary: {
          cumulativeGpa,
          totalAccumulatedCredits,
          completedSubjectsCount,
        },
        chartData: semesterHistory,
      };
    } catch (error) {
      // Nếu là lỗi NotFoundException chủ động throw ở trên thì giữ nguyên để bắt ở tầng Filter
      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error("Error fetching academic summary widget:", error);
      throw new InternalServerErrorException(
        "Lỗi hệ thống khi tải tóm tắt học tập.",
      );
    }
  }
}
