import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import {
  CreateClassSubjectDto,
  SearchClassSubjectDto,
  updateClassSubjectDto,
} from "../dto/classSubject.dto";
import { Prisma, RoleType } from "../../../prisma/generated/prisma/client";
import { plainToInstance } from "class-transformer";
import { ClassSubjectResponseDto } from "../dto/classSubject.response";
import { CourseOfferDetailResponseDto } from "../dto/classSubjectDetail.response";

@Injectable()
export class ClassSubjectService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lấy danh sách lớp học phần theo các tham số bộ lọc (Không phân trang)
   */
  async findAll(query: SearchClassSubjectDto, user?: any) {
    const { classId, semesterId, teacherId } = query;

    const where: Prisma.CourseOfferWhereInput = {};

    // 1. Áp dụng các bộ lọc cơ bản từ Query
    if (classId) {
      where.classId = classId;
    }

    if (semesterId) {
      where.semesterId = semesterId;
    }

    if (teacherId) {
      where.teacherId = teacherId;
    }

    // 2. Kẹp thêm điều kiện bảo mật dựa vào Phân Quyền (Business Role Rule)
    if (user.role === RoleType.teacher) {
      // Nếu là Giáo viên: Chỉ xem được các lớp học phần mà mình được phân công giảng dạy
      where.teacherId = user.staffId;
    } else if (user.role === RoleType.student) {
      // Nếu là Học sinh: Chỉ xem được các môn thuộc về lớp (baseClass) của chính mình
      where.baseClass = {
        students: {
          some: {
            id: user.studentId,
          },
        },
      };
    }
    // Admin và Staff giữ nguyên (không gán thêm điều kiện) để có quyền xem toàn bộ dữ liệu hệ thống

    // 3. Thực hiện truy vấn database
    const result = await this.prisma.courseOffer.findMany({
      where,
      include: {
        subject: true,
        semester: {
          select: {
            name: true,
            term: true,
            year: true,
          },
        },
        baseClass: {
          select: {
            className: true,
            classCode: true,
          },
        },
        teacher: true,
      },
      orderBy: {
        subject: {
          subjectName: "asc",
        },
      },
    });

    return plainToInstance(ClassSubjectResponseDto, result);
  }

  /**
   * Cập nhật classSubject
   */
  async updateClassSubject(
    classSubjectId: number,
    data: updateClassSubjectDto,
  ) {
    const result = await this.prisma.courseOffer.update({
      where: {
        id: classSubjectId,
      },
      data,
    });

    return result;
  }

  /**
   * Tạo ClassSubject
   */
  async createOptionalSection(
    dto: CreateClassSubjectDto,
    tx?: Prisma.TransactionClient,
  ) {
    const prismaClient = tx || this.prisma;

    const { semesterId, subjectId, classId, teacherId } = dto;

    // 1. Kiểm tra sự tồn tại của Môn học và Học kỳ
    const [subject, semester] = await Promise.all([
      prismaClient.subject.findUnique({ where: { id: subjectId } }),
      prismaClient.semester.findUnique({ where: { id: semesterId } }),
    ]);

    if (!subject || !semester) {
      throw new NotFoundException("Môn học hoặc Học kỳ không tồn tại");
    }

    // 2. Sinh mã lớp học phần tùy chọn
    try {
      const data = await prismaClient.courseOffer.create({
        data: {
          subjectId: subjectId,
          semesterId: semesterId,
          classId: classId || null,
          teacherId: teacherId || null,
        },
      });

      return {
        message: "Mở lớp học phần tùy chọn thành công",
        data,
      };
    } catch (error: any) {
      console.error("Lỗi khi tạo lớp học phần tùy chọn: ", error);
      throw new BadRequestException(
        "Lỗi khi tạo lớp học phần tùy chọn: " + error.message,
      );
    }
  }

  // Hỗ trợ format string giờ thành đối tượng Date cho Prisma @db.Time
  private formatTime(timeStr: string): Date {
    return new Date(`1970-01-01T${timeStr}Z`);
  }

  /**
   * Chi tiết classSubject
   */
  async getCourseOfferDetail(
    classSubjectId: number,
  ): Promise<CourseOfferDetailResponseDto | null> {
    // 1. Lấy thông tin lớp học phần và classId liên kết
    const classSubject = await this.prisma.courseOffer.findUnique({
      where: { id: classSubjectId },
      select: { classId: true },
    });

    const classId = classSubject?.classId;
    if (!classId) {
      throw new NotFoundException("Không tìm thấy lớp học");
    }

    // 2. Lấy danh sách toàn bộ học sinh đang ở trong lớp hành chính này
    const studentsInClass = await this.prisma.student.findMany({
      where: { classId: classId },
      select: { id: true },
    });
    const currentStudentIds = new Set(studentsInClass.map((s) => s.id));

    // 3. Lấy các học sinh hiện đang có bản ghi điểm trong lớp học phần này
    const existingGrades = await this.prisma.gradeStudent.findMany({
      where: { courseOfferId: classSubjectId },
      select: { studentId: true },
    });
    const existingStudentIds = new Set(existingGrades.map((g) => g.studentId));

    // =================================================================
    // 4. [LOGIC ĐỒNG BỘ 2 CHIỀU] - XỬ LÝ HỌC SINH THIẾU & HỌC SINH THỪA
    // =================================================================

    // Hướng A: Tìm học sinh mới vào lớp mà CHƯA có bản ghi điểm (THIẾU)
    const missingStudents = studentsInClass.filter(
      (student) => !existingStudentIds.has(student.id),
    );

    // Hướng B: Tìm studentId có điểm nhưng KHÔNG CÒN thuộc lớp này nữa (THỪA)
    const extraStudentIds = existingGrades
      .map((g) => g.studentId)
      .filter((id) => !currentStudentIds.has(id));

    // 5. Thực thi đồng bộ vào Database nếu có biến động dữ liệu
    if (missingStudents.length > 0 || extraStudentIds.length > 0) {
      await this.prisma.$transaction([
        // Hành động 1: Tạo bù nếu thiếu
        ...(missingStudents.length > 0
          ? [
              this.prisma.gradeStudent.createMany({
                data: missingStudents.map((student) => ({
                  studentId: student.id,
                  courseOfferId: classSubjectId,
                })),
                skipDuplicates: true,
              }),
            ]
          : []),

        // Hành động 2: Xóa bỏ nếu thừa (Học sinh đã bị xóa khỏi lớp)
        ...(extraStudentIds.length > 0
          ? [
              this.prisma.gradeStudent.deleteMany({
                where: {
                  courseOfferId: classSubjectId,
                  studentId: { in: extraStudentIds },
                },
              }),
            ]
          : []),
      ]);
    }

    // 6. Sau khi đã đồng bộ hoàn tất, tiến hành lấy toàn bộ thông tin chi tiết để trả về
    const courseOffer = await this.prisma.courseOffer.findUnique({
      where: { id: classSubjectId },
      include: {
        gradeStudents: {
          select: {
            student: {
              select: {
                id: true,
                fullName: true,
                studentCode: true,
                dob: true,
              },
            },
            kttx1: true,
            kttx2: true,
            kttx3: true,
            ktdk1: true,
            ktdk2: true,
            ktdk3: true,
            ktdk4: true,
            diemTB: true,
            diemKiemTra1: true,
            diemKiemTra2: true,
            diemTongKet1: true,
            diemTongKet2: true,
          },
        },
        teacher: {
          select: {
            id: true,
            fullName: true,
            departmentId: true,
          },
        },
        subject: true,
        baseClass: {
          select: {
            id: true,
            classCode: true,
            className: true,
          },
        },
      },
    });

    if (!courseOffer) {
      throw new NotFoundException("Không tìm thấy lớp học phần");
    }

    // 7. Xếp điểm học sinh theo thứ tự bảng chữ cái tiếng Việt
    const getLastName = (fullName: string) => {
      if (!fullName) return "";
      const parts = fullName.trim().split(/\s+/);
      return parts[parts.length - 1];
    };

    if (courseOffer.gradeStudents) {
      courseOffer.gradeStudents.sort((a, b) => {
        const nameA = getLastName(a.student?.fullName || "");
        const nameB = getLastName(b.student?.fullName || "");

        const compareName = nameA.localeCompare(nameB, "vi", {
          sensitivity: "base",
        });
        if (compareName !== 0) return compareName;

        return (a.student?.fullName || "").localeCompare(
          b.student?.fullName || "",
          "vi",
        );
      });
    }

    return plainToInstance(CourseOfferDetailResponseDto, courseOffer, {
      excludeExtraneousValues: false,
    });
  }

  /**
   * Gen bảng điểm và classSubject cho 1 batch
   */
  async getClassesByBatch(batchId: number) {
    const classes = await this.prisma.class.findMany({
      where: {
        batchId: batchId,
      },
    });

    return classes;
  }

  /**
   * Hàm tạo danh sách ClassSubject dựa theo khung chương trình
   */
  async createClassSubject(
    classData: any,
    semester: any,
    curriculumSubjects: any[],
    tx?: any,
  ) {
    const prismaClient = tx || this.prisma;

    // Chuẩn bị dữ liệu để Bulk Insert
    const courseOffersData = curriculumSubjects.map((cs) => ({
      subjectId: cs.subjectId,
      semesterId: semester.id,
      classId: classData.id,
    }));

    // Tạo hàng loạt lớp học phần
    await prismaClient.courseOffer.createMany({
      data: courseOffersData,
      skipDuplicates: true,
    });

    return await prismaClient.courseOffer.findMany({
      where: {
        classId: classData.id,
        semesterId: semester.id,
        subjectId: { in: curriculumSubjects.map((cs) => cs.subjectId) },
      },
    });
  }

  /**
   * 2. Hàm tự động đăng ký học phần và khởi tạo bảng điểm cho sinh viên trong lớp
   */
  async registerStudentsToCourses(
    studentsInClass: { id: number }[],
    validCourseOffers: { id: number }[],
    tx?: any,
  ) {
    const prismaClient = tx || this.prisma;
    let totalRegistrations = 0;

    // Chỉ thực hiện nếu lớp có học sinh và có lớp học phần được mở
    if (studentsInClass.length > 0 && validCourseOffers.length > 0) {
      const courseRegistrationsToCreate = studentsInClass.flatMap((student) =>
        validCourseOffers.map((course) => ({
          studentId: student.id,
          courseOfferId: course.id,
        })),
      );

      const result = await prismaClient.courseRegistration.createMany({
        data: courseRegistrationsToCreate,
        skipDuplicates: true,
      });
      totalRegistrations = result.count;
    }

    return totalRegistrations;
  }

  /**
   * 3. Hàm gốc dùng để điều phối luồng sinh dữ liệu học phần và đăng ký cho một lớp
   */
  async generateSectionForClass(classId: number, semesterId: number, tx?: any) {
    const prismaClient = tx || this.prisma;

    // Bước 1: Tìm kiếm và xác thực thông tin Lớp học, Khóa học và Học kỳ  22]
    const classData = await prismaClient.class.findUnique({
      where: { id: classId },
      include: {
        batch: { include: { curriculum: true } },
      },
    });

    if (!classData) {
      throw new NotFoundException(`Không tìm thấy lớp học với ID ${classId}`);
    }
    const batch = classData.batch;
    if (!batch?.curriculum) {
      throw new BadRequestException(
        "Lớp học chưa được gắn khung chương trình đào tạo!",
      );
    }

    const semester = await prismaClient.semester.findUnique({
      where: { id: semesterId },
    });
    if (!semester) {
      throw new NotFoundException(`Không tìm thấy học kỳ với ID ${semesterId}`);
    }

    // Bước 2: Tính toán số học kỳ hiện tại dựa theo mốc bắt đầu của Khóa học
    const startYear = batch.startYear || 0;
    const currentYear = semester.year || 0;
    const currentTerm = semester.term || 0;

    const semesterNo =
      startYear > 0 && currentYear >= startYear
        ? (currentYear - startYear) * 2 + currentTerm
        : 0;

    if (semesterNo === 0) {
      throw new BadRequestException(
        "Tính toán số học kỳ chương trình khung không hợp lệ!",
      );
    }

    // Bước 3: Lấy danh sách các môn học phân bổ cho học kỳ này
    const curriculumSubjects = await prismaClient.curriculumSubject.findMany({
      where: {
        curriculumId: batch.curriculum.id,
        semesterNumber: semesterNo,
      },
      include: { subject: true },
    });

    if (!curriculumSubjects.length) {
      return {
        message: `Học kỳ này (HK ${semesterNo}) trong khung chương trình không có môn học nào.`,
        generatedCoursesCount: 0,
      };
    }

    // Lấy danh sách học sinh thuộc lớp này
    const studentsInClass = await prismaClient.student.findMany({
      where: { classId },
      select: { id: true },
    });

    const validCourseOffers = await this.createClassSubject(
      classData,
      semester,
      curriculumSubjects,
      tx,
    );

    const totalRegistrations = await this.registerStudentsToCourses(
      studentsInClass,
      validCourseOffers,
      tx,
    );

    return {
      success: true,
      message: `Sinh dữ liệu thành công cho lớp ${classData.className}.`,
      details: {
        semesterNumber: semesterNo,
        coursesCreated: validCourseOffers.length,
        studentsRegistered: studentsInClass.length,
        totalRegistrations,
      },
    };
  }
}
