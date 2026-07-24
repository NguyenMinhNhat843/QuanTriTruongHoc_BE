import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import {
  ClassSubjectDetailDto,
  CreateClassSubjectDto,
  SearchClassSubjectDto,
  updateClassSubjectDto,
} from "../dto/classSubject.dto";
import { Prisma, RoleType } from "../../../prisma/generated/prisma/client";
import { plainToInstance } from "class-transformer";

@Injectable()
export class ClassSubjectService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lấy danh sách môn - lớp học theo các tham số bộ lọc (Không phân trang)
   */
  async findAll(query: SearchClassSubjectDto, user?: any) {
    const { classId, semesterId, teacherId, subjectId } = query;

    const where: Prisma.ClassSubjectWhereInput = {
      ...(classId && { classId: Number(classId) }),
      ...(semesterId && { semesterId: Number(semesterId) }),
      ...(teacherId && { teacherId: Number(teacherId) }),
      ...(subjectId && { subjectId: Number(subjectId) }),
    };

    if (user?.role === RoleType.teacher) {
      where.teacherId = user.staffId;
    } else if (user?.role === RoleType.student) {
      where.baseClass = {
        students: {
          some: {
            id: user.studentId,
          },
        },
      };
    }

    const result = await this.prisma.classSubject.findMany({
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
            currentSize: true,
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

    return plainToInstance(ClassSubjectDetailDto, result);
  }

  /**
   * Cập nhật classSubject
   */
  async updateClassSubject(classSubjectId: number, data: updateClassSubjectDto) {
    const result = await this.prisma.classSubject.update({
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
  async createOptionalSection(dto: CreateClassSubjectDto, tx?: Prisma.TransactionClient) {
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
      const data = await prismaClient.classSubject.create({
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
      throw new BadRequestException("Lỗi khi tạo lớp học phần tùy chọn: " + error.message);
    }
  }

  // Hỗ trợ format string giờ thành đối tượng Date cho Prisma @db.Time
  private formatTime(timeStr: string): Date {
    return new Date(`1970-01-01T${timeStr}Z`);
  }

  /**
   * Chi tiết classSubject
   */
  async getCourseOfferDetail(classSubjectId: number): Promise<ClassSubjectDetailDto | null> {
    // 1. Query thông tin cơ bản của lớp học phần + danh sách gradeStudents hiện có + danh sách sinh viên hiện tại của lớp
    const initialData = await this.prisma.classSubject.findUnique({
      where: { id: classSubjectId },
      select: {
        classId: true,
        subject: { select: { isThucTap: true } },
        gradeStudents: {
          include: {
            student: true,
          },
        },
        baseClass: {
          select: {
            students: {
              where: { status: "STUDYING" }, // Chỉ đồng bộ những sinh viên đang học
              select: { id: true },
            },
          },
        },
      },
    });

    if (!initialData || !initialData.classId) {
      throw new NotFoundException("Không tìm thấy lớp học phần hoặc lớp hành chính tương ứng");
    }

    const isThucTap = initialData.subject?.isThucTap ?? false;

    // 2. Tính toán danh sách học sinh thiếu / thừa bằng Set
    const currentStudents = initialData.baseClass?.students || [];
    const currentStudentIds = new Set(currentStudents.map((s) => s.id));

    const existingGradeStudentIds = new Set(initialData.gradeStudents.map((g) => g.studentId));

    const missingStudents = currentStudents.filter((s) => !existingGradeStudentIds.has(s.id));
    const extraStudentIds = initialData.gradeStudents
      .map((g) => g.studentId)
      .filter((id) => !currentStudentIds.has(id));

    // 3. Thực thi đồng bộ Database nếu có sự chênh lệch
    if (missingStudents.length > 0 || extraStudentIds.length > 0) {
      const syncOperations: any = [];

      if (missingStudents.length > 0) {
        syncOperations.push(
          this.prisma.gradeStudent.createMany({
            data: missingStudents.map((student) => ({
              studentId: student.id,
              classSubjectId: classSubjectId,
            })),
            skipDuplicates: true,
          }),
        );
      }

      if (extraStudentIds.length > 0) {
        syncOperations.push(
          this.prisma.gradeStudent.deleteMany({
            where: {
              classSubjectId: classSubjectId,
              studentId: { in: extraStudentIds },
            },
          }),
        );
      }

      await this.prisma.$transaction(syncOperations);
    }

    // 4. Dynamic select các trường điểm
    const gradeSelectFields = isThucTap
      ? {
          diemYThuc: true,
          diemChuyenMon: true,
          diemBaoCao: true,
          diemTB: true,
          diemTongKet1: true,
        }
      : {
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
        };

    // 5. Query lấy dữ liệu hoàn chỉnh để trả về
    const classSubjectDetail = await this.prisma.classSubject.findUnique({
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
            ...gradeSelectFields,
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

    if (!classSubjectDetail) {
      throw new NotFoundException("Không tìm thấy lớp học phần");
    }

    // 6. Sắp xếp danh sách học sinh theo Tên -> Họ tên đầy đủ (Chuẩn tiếng Việt)
    if (classSubjectDetail.gradeStudents?.length > 0) {
      const getLastName = (fullName?: string) => {
        if (!fullName) return "";
        const parts = fullName.trim().split(/\s+/);
        return parts[parts.length - 1];
      };

      classSubjectDetail.gradeStudents.sort((a, b) => {
        const fullNameA = a.student?.fullName || "";
        const fullNameB = b.student?.fullName || "";

        const lastNameA = getLastName(fullNameA);
        const lastNameB = getLastName(fullNameB);

        const compareLastName = lastNameA.localeCompare(lastNameB, "vi", { sensitivity: "base" });
        if (compareLastName !== 0) return compareLastName;

        return fullNameA.localeCompare(fullNameB, "vi", { sensitivity: "base" });
      });
    }

    return plainToInstance(ClassSubjectDetailDto, classSubjectDetail, {
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
  async createClassSubject(classData: any, semester: any, curriculumSubjects: any[], tx?: any) {
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
  async registerStudentsToCourses(studentsInClass: { id: number }[], validCourseOffers: { id: number }[], tx?: any) {
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
      throw new BadRequestException("Lớp học chưa được gắn khung chương trình đào tạo!");
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

    const semesterNo = startYear > 0 && currentYear >= startYear ? (currentYear - startYear) * 2 + currentTerm : 0;

    if (semesterNo === 0) {
      throw new BadRequestException("Tính toán số học kỳ chương trình khung không hợp lệ!");
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

    const validCourseOffers = await this.createClassSubject(classData, semester, curriculumSubjects, tx);

    const totalRegistrations = await this.registerStudentsToCourses(studentsInClass, validCourseOffers, tx);

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
