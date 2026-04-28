import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateBulkCourseOfferDto,
  PreviewCourseOfferDto,
} from "./courseOffer.dto";

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
}
