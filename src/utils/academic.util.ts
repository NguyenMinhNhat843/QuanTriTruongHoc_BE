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

// Định nghĩa cấu trúc Object tham số đầu vào
interface ResolveSemesterOptions {
  prisma: PrismaService;
  semesterId: number;
  classId?: number;
  batchId?: number;
}

export async function resolveCurriculumSemesterNumber({
  prisma,
  semesterId,
  classId,
  batchId,
}: ResolveSemesterOptions): Promise<number> {
  // 1. Kiểm tra ràng buộc bắt buộc: Phải có classId HOẶC batchId
  if (!classId && !batchId) {
    throw new BadRequestException(
      "Yêu cầu cung cấp ít nhất mã lớp học (classId) hoặc mã khóa đào tạo (batchId) để truy vấn.",
    );
  }

  let batchInfo: { startYear: number; curriculumId: number | null } | null =
    null;

  // 2. Lấy thông tin Khóa đào tạo (Batch) theo hướng tối ưu nhất
  if (batchId) {
    // Nếu có batchId, ưu tiên tìm thẳng trong bảng Batch để bỏ qua bảng Class
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      select: { startYear: true, curriculumId: true },
    });

    if (!batch) {
      throw new NotFoundException(
        `Không tìm thấy Khóa đào tạo có ID ${batchId}`,
      );
    }
    batchInfo = batch;
  } else if (classId) {
    // Nếu không có batchId nhưng có classId, truy vấn gián tiếp thông qua Class
    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        batch: {
          select: { startYear: true, curriculumId: true },
        },
      },
    });

    if (!classInfo) {
      throw new NotFoundException(`Không tìm thấy lớp học có ID ${classId}`);
    }

    if (!classInfo.batch) {
      throw new BadRequestException(
        "Lớp học này chưa được gán vào bất kỳ Khóa đào tạo nào.",
      );
    }
    batchInfo = classInfo.batch;
  }

  // Đảm bảo batchInfo luôn tồn tại (TypeScript Type Guard) và kiểm tra Chương trình khung
  if (!batchInfo || !batchInfo.curriculumId) {
    throw new BadRequestException(
      "Khóa đào tạo chưa được cấu hình Chương trình khung.",
    );
  }

  // 3. Tìm học kỳ thực tế đang xét
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

  // 4. Tính toán số thứ tự học kỳ (Semester Number)
  const yearDiff = semester.year - batchInfo.startYear;
  const semesterNumber = yearDiff * 2 + semester.term;

  if (semesterNumber <= 0) {
    throw new BadRequestException(
      "Học kỳ truyền vào diễn ra trước khi Khóa học bắt đầu.",
    );
  }

  return semesterNumber;
}
