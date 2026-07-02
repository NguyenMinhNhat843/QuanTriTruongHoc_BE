import { NotFoundException } from "@nestjs/common/exceptions/not-found.exception";
import { PrismaService } from "../prisma/prisma.service";
import { BadRequestException } from "@nestjs/common/exceptions/bad-request.exception";

export class AcademicUtils {
  /**
   * Tính toán chỉ số học kỳ (Semester Index) của sinh viên
   * @param enrollmentDate Ngày sinh viên nhập học
   * @param currentSemesterStartDate Ngày bắt đầu của học kỳ đang xét
   * @returns Số thứ tự học kỳ (1, 2, 3, 4...)
   */
  static calculateSemesterIndex(
    enrollmentDate: Date,
    currentSemesterStartDate: Date,
  ): number {
    const start = new Date(enrollmentDate);
    const current = new Date(currentSemesterStartDate);

    // 1. Tính số năm chênh lệch
    const yearsDiff = current.getFullYear() - start.getFullYear();

    // 2. Xác định học kỳ trong năm (Giả định: Tháng 1-6 là HK2, Tháng 8-12 là HK1)
    // Bạn có thể điều chỉnh logic này tùy theo quy định của trường
    const getSemesterOfYear = (date: Date): number => {
      const month = date.getMonth() + 1; // getMonth() chạy từ 0-11
      return month >= 8 || month <= 1 ? 1 : 2;
    };

    const startSem = getSemesterOfYear(start);
    const currentSem = getSemesterOfYear(current);

    // 3. Công thức tính tổng số học kỳ đã trôi qua
    // Ví dụ: Nhập học HK1-2025 (Kỳ 1), đến HK2-2025 là Kỳ 2, đến HK1-2026 là Kỳ 3
    const index = yearsDiff * 2 + (currentSem - startSem + 1);

    // Đảm bảo index không nhỏ hơn 1 (trường hợp tính toán sai lệch ngày)
    return index > 0 ? index : 1;
  }

  // helper check trùng lịch
  static isConflict = (a, b) => {
    return (
      a.dayOfWeek === b.dayOfWeek &&
      a.startTime < b.endTime &&
      b.startTime < a.endTime
    );
  };
}

export async function resolveCurriculumSemesterNumber(
  prisma: PrismaService, // Truyền prisma instance từ nơi gọi vào đây
  classId: number,
  semesterId: number,
): Promise<number> {
  const classInfo = await prisma.class.findUnique({
    where: { id: classId },
    include: { batch: true },
  });

  if (!classInfo) {
    throw new NotFoundException(`Không tìm thấy lớp học có ID ${classId}`);
  }

  if (!classInfo.batch || !classInfo.batch.curriculumId) {
    throw new BadRequestException(
      "Lớp học chưa được gán Khóa đào tạo hoặc Chương trình khung.",
    );
  }

  const semester = await prisma.semester.findUnique({
    where: { id: semesterId },
  });

  if (!semester) {
    throw new NotFoundException(`Không tìm thấy học kỳ có ID ${semesterId}`);
  }

  if (!semester.year || !semester.term) {
    throw new BadRequestException(
      "Học kỳ thực tế thiếu dữ liệu năm học (year) hoặc kỳ học (term).",
    );
  }

  const yearDiff = semester.year - classInfo.batch.startYear;
  const semesterNumber = yearDiff * 2 + semester.term;

  if (semesterNumber <= 0) {
    throw new BadRequestException(
      "Học kỳ truyền vào diễn ra trước khi Khóa học bắt đầu.",
    );
  }

  return semesterNumber;
}
