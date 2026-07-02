import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CurriculumSubjectService } from "../../curriculumSubject/curriculumnSubject.service";
import { CourseRegistrationService } from "../grades.service";
import {
  CreateClassSubjectDto,
  SearchClassSubjectDto,
  updateClassSubjectDto,
} from "../dto/classSubject.dto";
import { Prisma } from "../../../prisma/generated/prisma/client";
import { plainToInstance } from "class-transformer";
import {
  ClassSubjectResponseDto,
  ResponsePreviewGenerateSectionForClass,
} from "../classSubject.response";
import { CourseOfferDetailResponseDto } from "../classSubjectDetail.response";
import { resolveCurriculumSemesterNumber } from "../../utils/academic.util";

@Injectable()
export class ClassSubjectService {
  constructor(
    private prisma: PrismaService,
    private curriculumSubjectService: CurriculumSubjectService,
    private gradeService: CourseRegistrationService,
  ) {}

  /**
   * Lấy danh sách lớp học phần theo các tham số bộ lọc (Không phân trang)
   */
  async findAll(query: SearchClassSubjectDto) {
    const { classId, semesterId, teacherId } = query;

    const where: Prisma.CourseOfferWhereInput = {};

    if (classId) {
      where.classId = classId;
    }

    if (semesterId) {
      where.semesterId = semesterId;
    }

    if (teacherId) {
      where.teacherId = teacherId;
    }

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
   * Tạo lớp học phần
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
   * Chi tiết lớp học phần
   */
  async getCourseOfferDetail(
    classSubjectId: number,
  ): Promise<CourseOfferDetailResponseDto | null> {
    const grades = await this.prisma.courseRegistration.findMany({
      where: {
        courseOfferId: classSubjectId,
      },
    });
    console.log("Grades for classSubjectId", classSubjectId, ": ", grades);

    const classSubject = await this.prisma.courseOffer.findUnique({
      where: {
        id: classSubjectId,
      },
      select: {
        classId: true,
      },
    });
    const classId = classSubject?.classId;
    if (!classId) {
      throw new NotFoundException("Không tìm thấy lớp học");
    }

    // Chưa có bảng điểm nào được tạo cho lớp học phần này, tiến hành tạo mới
    if (!grades || grades.length === 0) {
      await this.gradeService.createGradeTable(classId, classSubjectId);
    }

    const courseOffer = await this.prisma.courseOffer.findUnique({
      where: { id: classSubjectId },
      include: {
        registrations: {
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

    // Xếp điểm học sinh theo thứ tự bảng chữ cái
    const getLastName = (fullName: string) => {
      if (!fullName) return "";
      const parts = fullName.trim().split(/\s+/);
      return parts[parts.length - 1];
    };
    if (courseOffer && courseOffer.registrations) {
      courseOffer.registrations.sort((a, b) => {
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

    if (!courseOffer) {
      throw new NotFoundException("Không tìm thấy lớp học phần");
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

  /**
   * Xem trước khi sinh classSubject
   */
  async previewGenerateSectionForClass(classId: number, semesterId: number) {
    const semester = await this.prisma.semester.findUnique({
      where: { id: semesterId },
    });
    if (!semester) {
      throw new NotFoundException(`Không tìm thấy học kỳ với ID ${semesterId}`);
    }

    const classDto = await this.prisma.class.findUnique({
      where: { id: classId },
    });
    if (!classDto) {
      throw new NotFoundException(`Không tìm thấy lớp học với ID ${classId}`);
    }

    const curriculumSubjects =
      await this.curriculumSubjectService.findByCurriculumAndSemester(
        semesterId,
        classId,
      );

    // 4. Duyệt qua từng môn để dựng cấu trúc lớp học phần dự kiến
    const previewList: ResponsePreviewGenerateSectionForClass[] = [];

    for (const cs of curriculumSubjects) {
      // Kiểm tra xem lớp học phần này đã được sinh ra trong hệ thống từ trước chưa
      const existingCourseOffer = await this.prisma.courseOffer.findUnique({
        where: {
          subjectId_classId: {
            subjectId: cs.subjectId,
            classId: classId,
          },
        },
      });

      previewList.push({
        subjectId: cs?.subjectId,
        subjectCode: cs?.subject?.subjectCode || "Không xác định",
        subjectName: cs?.subject?.subjectName || "Không xác định",
        credits: cs?.subject?.credits || 0,
        isExisted: !!existingCourseOffer,
      });
    }

    // 5. Trả về kết quả tổng quan
    return plainToInstance(ResponsePreviewGenerateSectionForClass, previewList);
  }

  /**
   * Phân công giảng dạy
   */
  async assignTeacher(body: SearchClassSubjectDto) {
    const classSubjects = await this.findAll(body);

    const teachers = await this.prisma.staff.findMany({
      where: {
        EmployeeRole: "TEACHER",
      },
      include: {
        teacherSubjects: true,
      },
    });

    for (const classSubject of classSubjects) {
      if (classSubject.teacherId) continue; // Nếu môn này có giáo viên rồi thì bỏ qua

      // Tìm giáo viên phù hợp
      const suitableTeacher = teachers.find((t) =>
        t.teacherSubjects.some((ts) => ts.subjectId === classSubject.subjectId),
      );

      if (suitableTeacher) {
        await this.prisma.courseOffer.update({
          where: {
            id: classSubject.id,
          },
          data: {
            teacherId: suitableTeacher.id,
          },
        });
      }
    }
  }

  /**
   * Lấy dữ liệu bảng kế hoạch giảng dạy của 1 học kỳ, 1 lớp (Môn học làm chủ)
   */
  async getStudySchedule(classId: number, semesterId: number) {
    // 1. Tính toán số học kỳ khung bằng hàm util
    const semesterNumber = await resolveCurriculumSemesterNumber(
      this.prisma,
      classId,
      semesterId,
    );

    // 2. Tìm thông tin lớp học để lấy curriculumId
    const classInfo = await this.prisma.class.findUnique({
      where: { id: classId },
      include: { batch: true },
    });

    if (!classInfo || !classInfo.batch || !classInfo.batch.curriculumId) {
      throw new BadRequestException(
        "Lớp học chưa được gán Khóa đào tạo hoặc Chương trình khung hợp lệ.",
      );
    }

    const curriculumId = classInfo.batch.curriculumId;

    // 3. Lấy TẤT CẢ các môn học được thiết kế trong học kỳ khung này (Bao gồm thông tin Subject chi tiết)
    const curriculumSubjects = await this.prisma.curriculumSubject.findMany({
      where: {
        curriculumId: curriculumId,
        semesterNumber: semesterNumber,
      },
      include: {
        subject: true, // Chắc chắn có dữ liệu chi tiết môn học
      },
    });

    // Nếu học kỳ khung này không có môn nào thì trả về mảng rỗng
    if (curriculumSubjects.length === 0) {
      return [];
    }

    const subjectIdsInSemester = curriculumSubjects.map((cs) => cs.subjectId);

    // 4. Tìm các CourseOffer đã được tạo cho lớp và học kỳ này (nếu có)
    const courseOffers = await this.prisma.courseOffer.findMany({
      where: {
        classId: classId,
        semesterId: semesterId,
        subjectId: {
          in: subjectIdsInSemester,
        },
      },
      include: {
        classSubjectSchedule: true, // Lấy lịch học đi kèm
      },
    });

    // Biến đổi mảng courseOffers thành Map để tìm kiếm nhanh theo subjectId với độ phức tạp O(1)
    const offerMap = new Map<number, (typeof courseOffers)[0]>();
    courseOffers.forEach((offer) => {
      offerMap.set(offer.subjectId, offer);
    });

    // 5. Map dữ liệu trả về lấy CurriculumSubject làm gốc
    return curriculumSubjects.map((cs) => {
      // Tìm xem môn này đã được tạo lớp học phần (CourseOffer) chưa
      const matchedOffer = offerMap.get(cs.subjectId);

      if (matchedOffer) {
        // Nếu ĐÃ CÓ classSubject (CourseOffer)
        const { classSubjectSchedule, ...classSubjectInfo } = matchedOffer;

        return {
          classSubject: classSubjectInfo, // Có thông tin lớp học phần
          subject: cs.subject, // Có thông tin môn học
          schedules:
            classSubjectSchedule.length > 0 ? classSubjectSchedule : null, // Trả về null nếu mảng lịch rỗng
        };
      } else {
        // Nếu CHƯA CÓ classSubject (Chưa được gán giáo viên/mở lớp học phần cho kỳ này)
        return {
          classSubject: null,
          subject: cs.subject, // Vẫn chắc chắn có thông tin môn học ở đây
          schedules: [],
        };
      }
    });
  }
}
