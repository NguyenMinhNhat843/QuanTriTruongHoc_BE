import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class StatisticsService {
  constructor(private prisma: PrismaService) {}

  async getOverviewStats() {
    // Sử dụng Promise.all để tối ưu hóa hiệu năng, chạy song song các câu lệnh đếm
    const [
      totalStudents,
      totalTeachers,
      studyingStudents,
      pendingStudents,
      registerStudents,
    ] = await Promise.all([
      // 1. Tổng số học sinh (tất cả trạng thái)
      this.prisma.student.count(),

      // 2. Tổng số giáo viên (Staff có EmployeeRole = TEACHER)
      this.prisma.staff.count({
        where: {
          EmployeeRole: "TEACHER",
        },
      }),

      // 3. Số học sinh đang học
      this.prisma.student.count({
        where: { status: "studying" },
      }),

      // 4. Số học sinh đang đợi xét tuyển
      this.prisma.student.count({
        where: { status: "pending" },
      }),

      // 5. Số học sinh đăng ký mới (tư vấn)
      this.prisma.student.count({
        where: { status: "registered" },
      }),
    ]);

    return {
      totalStudents,
      totalTeachers,
      studyingStudents,
      pendingStudents,
      registerStudents,
    };
  }

  async getAdvancedAnalytics() {
    // 1. Lấy học kỳ hiện tại để làm mốc thống kê vận hành
    const currentSemester = await this.prisma.semester.findFirst({
      where: { isCurrent: true },
    });

    const [
      // --- NHÓM 1: VẬN HÀNH LỚP HỌC & SĨ SỐ ---
      classesData,

      // --- NHÓM 2: TIẾN ĐỘ HỒ SƠ TUYỂN SINH ---
      totalAdmissionProfiles,
      pendingDocumentsCount,

      // --- NHÓM 3: ĐIỂM RÈN LUYỆN (Nếu có học kỳ hiện tại) ---
      assessmentStats,
    ] = await Promise.all([
      // Lấy danh sách lớp học để tính toán tỉ lệ lấp đầy và trạng thái
      this.prisma.class.findMany({
        select: { className: true, currentSize: true, maxStudents: true },
      }),

      // Tổng số hồ sơ xét tuyển học bạ cấp 2
      this.prisma.admissionProfile.count(),

      // Đếm số lượng học sinh chưa hoàn thiện đủ giấy tờ (ví dụ: thiếu file nhập học)
      this.prisma.studentDocument.count(),

      // Thống kê trạng thái phiếu điểm rèn luyện của kỳ hiện tại
      currentSemester
        ? this.prisma.assessment.groupBy({
            by: ["status"],
            where: {
              period: { semesterId: currentSemester.id },
            },
            _count: { id: true },
          })
        : Promise.resolve([]),
    ]);

    // --- XỬ LÝ LOGIC SỐ LIỆU ---

    // Tính toán tỷ lệ lấp đầy trung bình của toàn trường (Capacity Rate)
    const totalMaxStudents = classesData.reduce(
      (sum, c) => sum + c.maxStudents,
      0,
    );
    const totalCurrentStudents = classesData.reduce(
      (sum, c) => sum + c.currentSize,
      0,
    );
    const schoolFillRate =
      totalMaxStudents > 0
        ? parseFloat(
            ((totalCurrentStudents / totalMaxStudents) * 100).toFixed(2),
          )
        : 0;

    // Tìm các lớp đang có nguy cơ quá tải (sĩ số vượt hoặc bằng max)
    const overloadedClasses = classesData
      .filter((c) => c.currentSize >= c.maxStudents)
      .map((c) => ({
        className: c.className,
        size: `${c.currentSize}/${c.maxStudents}`,
      }));

    // Format lại dữ liệu điểm rèn luyện cho Frontend dễ vẽ biểu đồ trạng thái duyệt của GVCN
    const rènLuyệnSơBộ = {
      notSubmitted:
        assessmentStats.find((a) => a.status === "NOT_SUBMITTED")?._count.id ||
        0,
      pendingApproval:
        assessmentStats.find((a) => a.status === "PENDING")?._count.id || 0,
      approved:
        assessmentStats.find((a) => a.status === "APPROVED")?._count.id || 0,
    };

    return {
      semesterName: currentSemester?.name || "Chưa thiết lập học kỳ hiện tại",
      classrooms: {
        totalActiveClasses: classesData.length,
        schoolFillRate, // % lấp đầy toàn trường
        overloadedClassesCount: overloadedClasses.length, // Số lượng lớp quá tải
        overloadedClasses, // Danh sách cụ thể các lớp quá tải
        totalCurrentStudents,
        totalMaxStudents,
      },
      admissions: {
        totalProfilesProcessed: totalAdmissionProfiles,
        alertMissingDocuments: pendingDocumentsCount, // Cảnh báo số file học sinh nộp lỗi/thiếu cần xử lý
      },
      behaviorAssessment: currentSemester ? rènLuyệnSơBộ : null,
    };
  }
}
