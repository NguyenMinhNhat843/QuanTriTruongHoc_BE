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
