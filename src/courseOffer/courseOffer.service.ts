import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateBulkCourseOfferDto,
  CreateOptionalCourseOfferDto,
  PreviewCourseOfferDto,
} from "./courseOffer.dto";
import { CourseOfferStatus } from "../../prisma/generated/prisma/enums";

@Injectable()
export class CourseOfferService {
  constructor(private prisma: PrismaService) {}

  async previewSections(dto: PreviewCourseOfferDto) {
    const { semesterId, majorId, batchId } = dto;

    // --- BƯỚC 1: Tính toán semesterNumber ---
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
    });
    const semester = await this.prisma.semester.findUnique({
      where: { id: semesterId },
    });

    if (!batch || !semester) {
      throw new NotFoundException("Không tìm thấy Khóa đào tạo hoặc Học kỳ");
    }

    const startYear = batch.startYear;
    const currentYear =
      semester.year || new Date(semester.startDate).getFullYear();
    // Giả sử tên học kỳ chứa chuỗi "HK1" hoặc "HK2"
    const semesterTerm = semester.term!;

    const semesterNumber = (currentYear - startYear) * 2 + semesterTerm;
    console.log("semester number: ", semesterNumber);

    if (semesterNumber <= 0) {
      throw new BadRequestException(
        "Học kỳ được chọn diễn ra trước khi khóa này nhập học",
      );
    }

    // --- BƯỚC 2: Truy vấn danh sách môn học theo Chương trình khung ---
    // Tìm khung chương trình áp dụng cho ngành và khóa này
    const curriculum = await this.prisma.curriculum.findFirst({
      where: { majorId: majorId },
      orderBy: { createdAt: "desc" },
    });

    if (!curriculum) {
      throw new NotFoundException(
        "Không tìm thấy Chương trình khung cho ngành này",
      );
    }

    const subjectsInTerm = await this.prisma.curriculumSubject.findMany({
      where: {
        curriculumId: curriculum.id,
        semesterNumber: semesterNumber,
      },
      include: {
        subject: true,
      },
    });

    // --- BƯỚC 3: Xác định các lớp danh nghĩa (Nominal Classes) ---
    const nominalClasses = await this.prisma.class.findMany({
      where: {
        majorId: majorId,
        batchId: batchId,
      },
    });

    // --- TỔNG HỢP KẾT QUẢ DỰ KIẾN ---
    const previewData: any = [];
    for (const subItem of subjectsInTerm) {
      for (const nClass of nominalClasses) {
        previewData.push({
          subjectCode: subItem.subject.subjectCode,
          subjectName: subItem.subject.subjectName,
          nominalClassName: nClass.className,
          expectedCourseCode: `${subItem.subject.subjectCode}-${semester.name}-${nClass.className}`,
          maxStudents: nClass.maxStudents || 50,
        });
      }
    }

    return {
      summary: {
        calculatedSemesterNumber: semesterNumber,
        totalSubjects: subjectsInTerm.length,
        totalClasses: nominalClasses.length,
        totalSectionsToBeCreated: previewData.length,
      },
      previewData,
    };
  }

  /**
   * BƯỚC 4: Khởi tạo dữ liệu lớp học phần (Bulk Create)
   */
  async generateSections(dto: CreateBulkCourseOfferDto) {
    const { semesterId, majorId, batchId, registrationStart, registrationEnd } =
      dto;

    // 1. Tái sử dụng logic lấy thông tin cơ bản (Semester, Batch, Subjects, Classes)
    // Để tối ưu, bạn có thể gọi lại logic tính toán semesterNumber từ Bước 1, 2, 3
    const { subjectsInTerm, nominalClasses, semester } =
      await this.getGenerationContext(semesterId, majorId, batchId);

    // Chuẩn bị dữ liệu để insert hàng loạt
    const courseOffersToCreate: any = [];

    for (const subItem of subjectsInTerm) {
      for (const nClass of nominalClasses) {
        courseOffersToCreate.push({
          // courseCode: Tự động sinh (MãMôn-TênHọcKỳ-TênLớp) [cite: 216]
          courseCode: `${subItem.subject.subjectCode}-${semester.name}-${nClass.classCode}`,
          subjectId: subItem.subjectId, // Lấy từ Bước 2 [cite: 217]
          semesterId: semesterId, // Lấy từ Input [cite: 218]
          classId: nClass.id, // Lấy từ Bước 3 [cite: 219]

          maxStudents: nClass.maxStudents || 40, // Lấy theo bảng Class [cite: 221, 52]
          status: "planned", // Mặc định là planned [cite: 220]

          // Thời gian đăng ký (nếu có truyền từ DTO)
          registrationStart: registrationStart
            ? new Date(registrationStart)
            : null,
          registrationEnd: registrationEnd ? new Date(registrationEnd) : null,
        });
      }
    }

    // Thực hiện Create Bulk vào database [cite: 212]
    // Sử dụng createMany để tối ưu hiệu năng
    const result = await this.prisma.courseOffer.createMany({
      data: courseOffersToCreate,
      skipDuplicates: true, // Tránh lỗi nếu đã lỡ tạo rồi
    });

    return {
      message: `Đã khởi tạo thành công ${result.count} lớp học phần.`,
      count: result.count,
    };
  }

  // =========================================
  // Hàm tái sử dụng để lấy thông tin cơ bản cho cả preview và generate
  // =========================================
  private async getGenerationContext(
    semesterId: number,
    majorId: number,
    batchId: number,
  ) {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
    });
    const semester = await this.prisma.semester.findUnique({
      where: { id: semesterId },
    });

    if (!batch || !semester)
      throw new NotFoundException("Dữ liệu không hợp lệ");

    // Tính semesterNumber [cite: 200]
    const semesterNumber =
      (semester.year! - batch.startYear) * 2 + semester.term!;

    // Lấy môn học theo CTK [cite: 206]
    const curriculum = await this.prisma.curriculum.findFirst({
      where: { majorId, isActive: true },
      orderBy: { createdAt: "desc" },
    });

    if (!curriculum)
      throw new NotFoundException(
        "Không tìm thấy Chương trình khung cho ngành này",
      );

    const subjectsInTerm = await this.prisma.curriculumSubject.findMany({
      where: { curriculumId: curriculum.id, semesterNumber },
      include: { subject: true },
    });

    // Lấy các lớp danh nghĩa [cite: 210]
    const nominalClasses = await this.prisma.class.findMany({
      where: { majorId, batchId },
    });

    return { subjectsInTerm, nominalClasses, semester };
  }

  // =========================================
  // Hàm tạo lớp học phần tùy chọn (Optional Course Offer)
  // =========================================
  async createOptionalSection(dto: CreateOptionalCourseOfferDto) {
    const {
      semesterId,
      subjectId,
      classId,
      maxStudents,
      registrationStart,
      registrationEnd,
    } = dto;

    // 1. Kiểm tra sự tồn tại của Môn học và Học kỳ
    const [subject, semester] = await Promise.all([
      this.prisma.subject.findUnique({ where: { id: subjectId } }),
      this.prisma.semester.findUnique({ where: { id: semesterId } }),
    ]);

    if (!subject || !semester) {
      throw new NotFoundException("Môn học hoặc Học kỳ không tồn tại");
    }

    // 2. Sinh mã lớp học phần (Course Code) tùy chọn
    // Định dạng: [MãMôn]-[TênHọcKỳ]-OPT-[SốNgẫuNhiên/ThứTự]
    // Ví dụ: POL101-HK12026-OPT1
    const timestamp = Date.now().toString().slice(-3);
    const generatedCode = `${subject.subjectCode}-${semester.name}-OPT${timestamp}`;

    // 3. Tạo bản ghi mới
    try {
      const newSection = await this.prisma.courseOffer.create({
        data: {
          courseCode: generatedCode,
          subjectId: subjectId,
          semesterId: semesterId,
          classId: classId || null, // Có thể không thuộc lớp danh nghĩa nào
          maxStudents: maxStudents,
          status: "open", // Mở luôn để sinh viên thấy và đăng ký
          registrationStart: registrationStart
            ? new Date(registrationStart)
            : null,
          registrationEnd: registrationEnd ? new Date(registrationEnd) : null,
          // Nếu trong schema của bạn có trường lưu tên lớp hiển thị riêng:
          // name: courseName
        },
        include: {
          subject: true,
          semester: true,
        },
      });

      return {
        message: "Mở lớp học phần tùy chọn thành công",
        data: newSection,
      };
    } catch (error: any) {
      console.error("Lỗi khi tạo lớp học phần tùy chọn: ", error);
      throw new BadRequestException(
        "Lỗi khi tạo lớp học phần tùy chọn: " + error.message,
      );
    }
  }

  // ========================================
  // PHÂN BỐ LỊCH HỌC VÀ PHÒNG HỌC CHO LỚP HỌC PHẦN (Optional, có thể thêm sau)
  // ========================================
  async autoAssignTeacher(courseOfferId: number) {
    return await this.prisma.$transaction(async (tx) => {
      // --- Bước 1: Kiểm tra sự tồn tại và trạng thái
      const courseOffer = await tx.courseOffer.findUnique({
        where: { id: courseOfferId },
        include: { subject: true, semester: true },
      });

      if (!courseOffer)
        throw new NotFoundException("Lớp học phần không tồn tại");

      // Kiểm tra trạng thái hợp lệ
      if (
        courseOffer.status !== CourseOfferStatus.planned &&
        courseOffer.status !== CourseOfferStatus.open
      ) {
        throw new BadRequestException(
          "Trạng thái lớp không cho phép phân công tự động",
        );
      }

      // --- Bước 2 & 3: Lấy danh sách giảng viên phù hợp & Sắp xếp theo mức độ bận
      const teachers = await tx.staff.findMany({
        where: {
          teacherSubjects: { some: { subjectId: courseOffer.subjectId } }, // Bước 2: Đúng môn
        },
        include: {
          _count: {
            select: {
              courseOffers: { where: { semesterId: courseOffer.semesterId } },
            },
          },
        },
        orderBy: {
          courseOffers: { _count: "asc" }, // Bước 3: Ưu tiên ít lớp hơn
        },
      });

      if (teachers.length === 0) {
        return {
          success: false,
          message: "Không có giảng viên nào có khả năng dạy môn này",
        };
      }

      // Giả định danh sách khung giờ (Time Slots) mẫu [cite: 249]
      // Trong thực tế, bạn có thể lấy từ DB hoặc cấu hình hệ thống
      const availableTimeSlots = [
        { day: "MONDAY", start: "07:30:00", end: "11:30:00" },
        { day: "TUESDAY", start: "13:30:00", end: "17:30:00" },
        // ... các khung giờ khác
      ];

      // --- Bước 4: Duyệt từng giảng viên --- [cite: 244]
      for (const teacher of teachers) {
        // --- Bước 5: Duyệt danh sách khung giờ --- [cite: 248]
        for (const slot of availableTimeSlots) {
          // --- Bước 6: Kiểm tra xung đột (Validation) --- [cite: 252]

          // 6.1 Kiểm tra trùng lịch giảng viên [cite: 254]
          const teacherConflict = await tx.courseSchedule.findFirst({
            where: {
              courseOffer: {
                teacherId: teacher.id,
                semesterId: courseOffer.semesterId,
              },
              dayOfWeek: slot.day as any,
              OR: [
                {
                  startTime: { lt: this.formatTime(slot.end) },
                  endTime: { gt: this.formatTime(slot.start) },
                },
              ],
            },
          });

          if (teacherConflict) continue; // Nếu trùng lịch giảng viên, thử slot khác

          // 6.2 Kiểm tra trùng lịch phòng học (Giả định lấy phòng mặc định hoặc trống) [cite: 261]
          // Phần này có thể mở rộng để tìm phòng trống từ bảng Room [cite: 176]
          const roomId = 1; // Ví dụ phòng số 1

          const roomConflict = await tx.courseSchedule.findFirst({
            where: {
              roomId: roomId,
              dayOfWeek: slot.day as any,
              OR: [
                {
                  startTime: { lt: this.formatTime(slot.end) },
                  endTime: { gt: this.formatTime(slot.start) },
                },
              ],
            },
          });

          if (roomConflict) continue; // Nếu trùng phòng, thử slot khác

          // --- Bước 7: Gán giảng viên và tạo lịch học --- [cite: 268]
          // Nếu đến đây không có xung đột (Conflict)
          await tx.courseOffer.update({
            where: { id: courseOfferId },
            data: {
              teacherId: teacher.id, // [cite: 271]
              startDate: courseOffer.semester.startDate, // Bước 9: Đồng bộ thời gian
              endDate: courseOffer.semester.endDate,
            },
          });

          await tx.courseSchedule.create({
            // [cite: 272]
            data: {
              courseOfferId: courseOfferId,
              dayOfWeek: slot.day as any,
              startTime: this.formatTime(slot.start),
              endTime: this.formatTime(slot.end),
              roomId: roomId,
            },
          });

          return {
            success: true,
            teacherName: teacher.fullName,
            slot: slot,
          };
        }
      }

      // --- Bước 8: Xử lý khi không tìm được --- [cite: 275]
      return {
        success: false,
        message: "Không tìm được giảng viên và khung giờ phù hợp",
      };
    });
  }

  // Hỗ trợ format string giờ thành đối tượng Date cho Prisma @db.Time
  private formatTime(timeStr: string): Date {
    return new Date(`1970-01-01T${timeStr}Z`);
  }
}
