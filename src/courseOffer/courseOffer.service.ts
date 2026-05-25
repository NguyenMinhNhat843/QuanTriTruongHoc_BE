import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateBulkCourseOfferDto,
  CreateOptionalCourseOfferDto,
  SearchCourseOfferDto,
  updateClassSubjectDto,
} from "./courseOffer.dto";
import { CourseOfferStatus } from "../../prisma/generated/prisma/enums";
import { plainToInstance } from "class-transformer";
import { CourseOfferDetailResponseDto } from "./courseOfferDetail.response";
import * as ExcelJS from "exceljs";
import * as path from "path";
import { CourseOfferQuery } from "./courseOffer.query";
import { Prisma } from "../../prisma/generated/prisma/client";
import { CurriculumSubjectService } from "../curriculumSubject/curriculumnSubject.service";
import {
  CourseOfferDto,
  ResponsePreviewGenerateSectionForClass,
} from "./courseOffer.response";

@Injectable()
export class CourseOfferService {
  constructor(
    private prisma: PrismaService,
    private courseOfferQuery: CourseOfferQuery,
    private curriculumSubjectService: CurriculumSubjectService,
  ) {}

  /**
   * Lấy danh sách lớp học phần theo các tham số bộ lọc (Không phân trang)
   */
  async findAll(query: SearchCourseOfferDto) {
    const { classId, semesterId, teacherId, status, search } = query;

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

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        {
          courseCode: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          courseName: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    const result = await this.prisma.courseOffer.findMany({
      where,
      include: {
        subject: true,
        semester: true,
        baseClass: true,
        teacher: true,
        _count: {
          select: {
            registrations: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return plainToInstance(CourseOfferDto, result);
  }

  /**
   * update classSubject
   */
  async updateClassSubject(id: number, updateData: updateClassSubjectDto) {
    const { teacherId, maxStudents } = updateData;
    const courseOffer = await this.prisma.courseOffer.update({
      where: { id },
      data: {
        teacherId,
        maxStudents,
      },
    });

    return plainToInstance(CourseOfferDto, courseOffer);
  }

  /**
   * Khi Admin tạo các classSubject tự động cho học kỳ này sẽ gọi api này để xem trước
   */
  async previewGenClassSubjects(dto: CreateBulkCourseOfferDto) {
    const { semesterId, batchId } = dto;
    const { nominalClasses, semester, subjectsInTerm, semesterNumber } =
      await this.getGenerationContext(semesterId, batchId);

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
   * Sinh ClassSubject (Bulk Create)
   */
  async genClassSubjects(dto: CreateBulkCourseOfferDto) {
    const { semesterId, batchId, startTime, endTime } = dto;

    const { subjectsInTerm, nominalClasses, semester } =
      await this.getGenerationContext(semesterId, batchId);

    const courseOffersToCreate: any = [];
    for (const subItem of subjectsInTerm) {
      for (const nClass of nominalClasses) {
        courseOffersToCreate.push({
          courseCode: `${subItem.subject.subjectCode}-${semester.name}-${nClass.classCode}`,
          subjectId: subItem.subjectId,
          semesterId: semesterId,
          classId: nClass.id,

          maxStudents: nClass.maxStudents || 40,
          status: "open",

          startDate: startTime ? new Date(startTime) : null,
          endDate: endTime ? new Date(endTime) : null,
        });
      }
    }

    const result = await this.prisma.courseOffer.createMany({
      data: courseOffersToCreate,
      skipDuplicates: true,
    });

    return {
      message: `Đã khởi tạo thành công ${result.count} lớp học phần.`,
      count: result.count,
    };
  }

  /**
   * Lấy ngữ cảnh cho việc khởi tạo lớp học phần
   */
  private async getGenerationContext(semesterId: number, batchId: number) {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        major: true,
        curriculum: {
          include: {
            curriculumSubjects: true,
          },
        },
      },
    });
    const majorId = batch?.majorId;
    const curriculum = batch?.curriculum;

    const semester = await this.prisma.semester.findUnique({
      where: { id: semesterId },
    });

    if (!batch || !semester)
      throw new NotFoundException("Dữ liệu không hợp lệ");

    // Tính semesterNumber
    const semesterNumber =
      (semester.year! - batch.startYear) * 2 + semester.term!;

    if (!curriculum)
      throw new NotFoundException(
        "Không tìm thấy Chương trình khung cho ngành này",
      );

    // Lấy danh sách môn học theo học kỳ trong chương trình khung
    const subjectsInTerm = await this.prisma.curriculumSubject.findMany({
      where: { curriculumId: curriculum.id, semesterNumber },
      include: { subject: true },
    });

    // Lấy các lớp danh nghĩa
    const nominalClasses = await this.prisma.class.findMany({
      where: { majorId, batchId },
    });

    return { subjectsInTerm, nominalClasses, semester, semesterNumber };
  }

  /**
   * Tạo lớp học phần
   */
  async createOptionalSection(
    dto: CreateOptionalCourseOfferDto,
    tx?: Prisma.TransactionClient,
  ) {
    const prismaClient = tx || this.prisma;

    const {
      semesterId,
      subjectId,
      classId,
      maxStudents,
      registrationStart,
      registrationEnd,
      teacherId,
    } = dto;

    // 1. Kiểm tra sự tồn tại của Môn học và Học kỳ
    const [subject, semester] = await Promise.all([
      prismaClient.subject.findUnique({ where: { id: subjectId } }),
      prismaClient.semester.findUnique({ where: { id: semesterId } }),
    ]);

    if (!subject || !semester) {
      throw new NotFoundException("Môn học hoặc Học kỳ không tồn tại");
    }

    // 2. Sinh mã lớp học phần tùy chọn
    const timestamp = Date.now().toString().slice(-3);
    const generatedCode = `${subject.subjectCode}-${semester.name}-OPT${timestamp}`;
    const courseName = `${subject.subjectName} ${classId ? `(Lớp ${classId})` : "(Tùy chọn)"}`;

    try {
      const data = await prismaClient.courseOffer.create({
        data: {
          courseCode: generatedCode,
          subjectId: subjectId,
          semesterId: semesterId,
          classId: classId || null,
          maxStudents: maxStudents,
          courseName: courseName,
          status: "open",
          registrationStart: registrationStart
            ? new Date(registrationStart)
            : null,
          registrationEnd: registrationEnd ? new Date(registrationEnd) : null,
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

      // Giả định danh sách khung giờ (Time Slots) mẫu
      // Trong thực tế, bạn có thể lấy từ DB hoặc cấu hình hệ thống
      const availableTimeSlots = [
        { day: "MONDAY", start: "07:30:00", end: "11:30:00" },
        { day: "TUESDAY", start: "13:30:00", end: "17:30:00" },
        // ... các khung giờ khác
      ];

      // --- Bước 4: Duyệt từng giảng viên ---
      for (const teacher of teachers) {
        // --- Bước 5: Duyệt danh sách khung giờ ---
        for (const slot of availableTimeSlots) {
          // --- Bước 6: Kiểm tra xung đột (Validation) ---

          // 6.1 Kiểm tra trùng lịch giảng viên
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

          // 6.2 Kiểm tra trùng lịch phòng học (Giả định lấy phòng mặc định hoặc trống)
          // Phần này có thể mở rộng để tìm phòng trống từ bảng Room
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

          // --- Bước 7: Gán giảng viên và tạo lịch học ---
          // Nếu đến đây không có xung đột (Conflict)
          await tx.courseOffer.update({
            where: { id: courseOfferId },
            data: {
              teacherId: teacher.id, //
              startDate: courseOffer.semester.startDate, // Bước 9: Đồng bộ thời gian
              endDate: courseOffer.semester.endDate,
            },
          });

          await tx.courseSchedule.create({
            //
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

      // --- Bước 8: Xử lý khi không tìm được ---
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

  /**
   * Chi tiết lớp học phần
   */
  async getCourseOfferDetail(
    courseOfferId: number,
  ): Promise<CourseOfferDetailResponseDto> {
    // 1. Query dữ liệu từ Database thông qua Prisma
    const courseOffer = await this.prisma.courseOffer.findUnique({
      where: { id: courseOfferId },
      include: {
        registrations: {
          select: {
            student: {
              select: {
                id: true, // Nên lấy thêm ID để khớp hoàn toàn với DTO
                fullName: true,
                studentCode: true,
                dob: true,
              },
            },
            gradeEntries: {
              select: {
                componentId: true,
                score: true,
                status: true,
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
            id: true, // Nên lấy thêm ID để khớp hoàn toàn với DTO
            fullName: true,
            departmentId: true,
          },
        },
        subject: {
          include: {
            subjectGrades: {
              include: {
                gradeComponent: true,
              },
            },
          },
        },
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

    // 4. Chuyển đổi object thô sang Instance của DTO bằng class-transformer
    return plainToInstance(CourseOfferDetailResponseDto, courseOffer, {
      excludeExtraneousValues: false,
      // Đặt false để giữ lại các trường mặc định từ Prisma mà không cần phải viết @Expose() cho từng field trong DTO.
    });
  }

  /**
   * Xuất excel danh sách điểm của lớp học phần
   * File excel sẽ được tạo dựa trên template có sẵn trong thư mục assets của project
   * Template này đã được thiết kế sẵn với phần header và định dạng cơ bản
   * Phần dữ liệu điểm sẽ được chèn động vào template dựa trên cấu trúc đã định nghĩa
   */
  async exportToExcel(classSubjectId: number) {
    // 1. Xác định đường dẫn file template (Sử dụng process.cwd() để an toàn cho cả dev và production)
    const templatePath = path.join(
      process.cwd(),
      "dist",
      "assets",
      "bangdiem_template.xlsx",
    );

    // 2. Khởi tạo Workbook và đọc file template
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);
    const worksheet = workbook.worksheets[0];

    const { keyValueData, gradeTable } =
      await this.courseOfferQuery.queryDataForExportExcel(classSubjectId);

    const startGradeColumnIndex = 8;

    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        if (cell.value && typeof cell.value === "string") {
          let cellString = cell.value;

          const matches = cellString.match(/{{(.*?)}}/g);
          if (matches) {
            matches.forEach((match) => {
              const key = match.replace("{{", "").replace("}}", "").trim();
              if (keyValueData[key] !== undefined) {
                cellString = cellString.replace(match, keyValueData[key]);
              }
            });
            cell.value = cellString;
          }
        }
      });
    });

    gradeTable.forEach((item, index) => {
      const currentRowNum = startGradeColumnIndex + index;
      const row = worksheet.getRow(currentRowNum);

      // Điền dữ liệu vào từng cột tương ứng theo template hình ảnh
      row.getCell("A").value = index + 1; // STT
      row.getCell("B").value = item.student.studentCode; // MSSV
      row.getCell("C").value = item.student.fullName; // Họ tên

      // Format Ngày sinh (nếu có)
      if (item.student.dob) {
        const dobDate = new Date(item.student.dob);
        row.getCell("D").value = dobDate;
        row.getCell("D").numFmt = "dd/mm/yyyy"; // Định dạng ngày tháng trong Excel
      } else {
        row.getCell("D").value = "";
      }

      // Điểm Thường Xuyên (KTTX)
      row.getCell("E").value = item.kttx1; // KTTX Lần 1
      row.getCell("F").value = item.kttx2; // KTTX Lần 2
      row.getCell("G").value = item.kttx3; // KTTX Lần 3

      // Kiểm tra định kỳ
      row.getCell("H").value = item.ktdk1; // Định kỳ Lần 1
      row.getCell("I").value = item.ktdk2; // Định kỳ Lần 2
      row.getCell("J").value = item.ktdk3; // Định kỳ Lần 3
      row.getCell("K").value = item.ktdk4; // Định kỳ Lần 4

      // Trung bình & Điểm kiểm tra
      row.getCell("L").value = item.diemTB; // Trung bình
      row.getCell("M").value = item.diemKiemTra1; // Điểm kiểm tra Lần 1
      row.getCell("N").value = item.diemKiemTra2; // Điểm kiểm tra Lần 2

      // Tổng kết & Ghi chú
      row.getCell("O").value = item.diemTongKet1; // Tổng kết lần 1
      row.getCell("P").value = item.diemTongKet2; // Tổng kết lần 2
      row.getCell("Q").value = item.note; // Ghi chú

      row.commit();
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
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
      maxStudents: classData.maxStudents || 40,
      status: "open" as const,
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
          status: "registered",
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

    // 🌟 Thực thi hàm nhỏ 1: Tạo các lớp học phần (courseOffer)
    const validCourseOffers = await this.createClassSubject(
      classData,
      semester,
      curriculumSubjects,
      tx,
    );

    // 🌟 Thực thi hàm nhỏ 2: Đăng ký học phần (Khởi tạo bảng điểm) cho sinh viên
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
   * Xem trước khi sinh lớp học phần
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
      // Công thức ghép mã và tên lớp học phần lấy chính xác từ hàm sinh thực tế của bạn
      const expectedCourseCode = `${cs?.subject?.subjectCode}-${classDto?.classCode}-${semester.name}`;
      const expectedCourseName = `${cs?.subject?.subjectName} (Lớp ${classDto?.className || classId})`;

      // Kiểm tra xem lớp học phần này đã được sinh ra trong hệ thống từ trước chưa
      const existingCourseOffer = await this.prisma.courseOffer.findUnique({
        where: { courseCode: expectedCourseCode },
      });

      previewList.push({
        subjectId: cs?.subjectId,
        subjectCode: cs?.subject?.subjectCode || "Không xác định",
        subjectName: cs?.subject?.subjectName || "Không xác định",
        credits: cs?.subject?.credits || 0,
        expectedCourseCode: expectedCourseCode,
        expectedCourseName: expectedCourseName,
        isExisted: !!existingCourseOffer,
      });
    }

    // 5. Trả về kết quả tổng quan
    return plainToInstance(ResponsePreviewGenerateSectionForClass, previewList);
  }
}
