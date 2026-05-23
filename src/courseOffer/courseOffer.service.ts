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
   * Khi Admin tạo các lớp học phần tự động cho học kỳ này sẽ gọi api này để xem trước
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
   * Sinh lớp học phần (Bulk Create)
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
          include: {
            student: {
              select: {
                id: true, // Nên lấy thêm ID để khớp hoàn toàn với DTO
                fullName: true,
                studentCode: true,
              },
            },
            gradeEntries: {
              select: {
                componentId: true,
                score: true,
                status: true,
              },
            },
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
   * Lấy danh sách học sinh đủ điều kiện đăng ký học phần
   * Học sinh đó có trạng thái là đang học và ngành phải khớp với lớp học phần
   */
  async getEligibleStudentsForCourseOffer(courseOfferId: number) {
    // 1. Lấy thông tin lớp học phần (CourseOffer) cùng với ngành học (majorId) liên quan
    // Giả sử majorId nằm trong bảng Subject (Môn học) hoặc trực tiếp trong CourseOffer
    const courseOffer = await this.prisma.courseOffer.findUnique({
      where: { id: courseOfferId },
      include: {
        baseClass: true,
      },
    });

    if (!courseOffer) {
      throw new NotFoundException(
        `Không tìm thấy lớp học phần với ID ${courseOfferId}`,
      );
    }

    // Xác định majorId mục tiêu của lớp học phần này
    // (Bạn điều chỉnh lại dòng này nếu majorId nằm ở vị trí khác, ví dụ: courseOffer.majorId)
    const targetMajorId = courseOffer.baseClass?.majorId;

    if (!targetMajorId) {
      throw new BadRequestException(
        `Lớp học phần này chưa được cấu hình ngành học (majorId)`,
      );
    }

    // 2. Tìm kiếm sinh viên đi xuyên qua bảng batch để lọc theo majorId
    const students = await this.prisma.student.findMany({
      where: {
        status: "studying", // Điều kiện 1: Trạng thái đang học

        // Điều kiện 2: Đi qua quan hệ 'batch' để kiểm tra 'majorId'
        batch: {
          majorId: targetMajorId,
        },
      },
      include: {
        batch: true, // Include thêm thông tin khóa đào tạo nếu cần hiển thị ở UI
      },
    });

    return students;
  }

  /**
   * Xuất excel danh sách điểm của lớp học phần
   * File excel sẽ được tạo dựa trên template có sẵn trong thư mục assets của project
   * Template này đã được thiết kế sẵn với phần header và định dạng cơ bản
   * Phần dữ liệu điểm sẽ được chèn động vào template dựa trên cấu trúc đã định nghĩa
   */
  async exportToExcel(courseOfferId: number) {
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

    const { keyValueData, gradeComponentsData, students } =
      await this.courseOfferQuery.queryDataForExportExcel(courseOfferId);

    // Đổ dữ liệu chung
    let headerRowNumber = 6; // Mặc định hàng tiêu đề
    let startGradeColumnIndex = 5; // Mặc định cột E (Cột số 5)

    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        if (cell.value && typeof cell.value === "string") {
          let cellString = cell.value;

          // Lưu lại tọa độ nếu tìm thấy biến đánh dấu cột điểm
          if (cellString.includes("{{gradeColumns}}")) {
            headerRowNumber = rowNumber;
            startGradeColumnIndex = colNumber;
          }

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

    // Đổ dữ liệu các cột điểm động vào hàng tiêu đề, bắt đầu từ cột đã xác định
    const headerRow = worksheet.getRow(headerRowNumber);
    const sampleStyleCell = headerRow.getCell(startGradeColumnIndex - 1); // Lấy style cột trước (Cột Ngày Sinh) để copy

    gradeComponentsData.forEach((comp, index) => {
      const currentCell = headerRow.getCell(startGradeColumnIndex + index);
      currentCell.value = comp.componentName;

      // Copy format từ ô mẫu sang để giữ nguyên font/màu nền tiêu đề
      currentCell.style = { ...sampleStyleCell.style };
      currentCell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
    });

    // Đổ dữ liệu sinh viên và điểm số vào các hàng tiếp theo
    const startDataRowNumber = headerRowNumber + 1; // Hàng bắt đầu chèn dữ liệu (Ví dụ hàng số 8)
    const sampleDataRow = worksheet.getRow(startDataRowNumber); // Hàng mẫu để lấy border

    students.forEach((student, sIndex) => {
      const currentStyleRowNo = startDataRowNumber + sIndex;

      // Chèn 1 dòng mới tinh để tránh đè lên phần chữ ký phía dưới của template
      worksheet.insertRow(currentStyleRowNo, []);
      const currentRow = worksheet.getRow(currentStyleRowNo);

      // 1. Ghi các cột cố định
      currentRow.getCell(1).value = sIndex + 1; // STT
      currentRow.getCell(2).value = student.studentCode; // Mã SV
      currentRow.getCell(3).value = student.fullName || ""; // Họ tên

      if (student.dob) {
        // Format ngày sinh về dạng ngày/tháng/năm
        currentRow.getCell(4).value = new Date(student.dob).toLocaleDateString(
          "vi-VN",
        );
      } else {
        currentRow.getCell(4).value = "";
      }

      // 2. Ghi điểm tương ứng vào từng cột điểm động
      gradeComponentsData.forEach((comp, cIndex) => {
        const gradeCell = currentRow.getCell(startGradeColumnIndex + cIndex);

        // Tìm xem sinh viên này có điểm của cột comp.componentName này không
        const matchedGrade = student.grades.find(
          (g) => g.column === comp.componentName,
        );

        // Nếu matchedGrade tồn tại và score không phải null thì điền score, ngược lại để trống
        gradeCell.value =
          matchedGrade && matchedGrade.score !== null ? matchedGrade.score : "";
        gradeCell.alignment = { horizontal: "center" };
      });

      // 3. Đồng bộ Border và Font từ dòng mẫu sang để bảng có lưới đẹp mắt
      currentRow.eachCell((cell, colNumber) => {
        const sampleCell = sampleDataRow.getCell(colNumber);
        cell.border = sampleCell.border;
        cell.font = sampleCell.font;
      });

      currentRow.commit(); // Lưu thay đổi của hàng này
    });

    // 6. Trả file về dưới dạng Buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  /**
   * Sinh lớp học phần theo học kỳ cho 1 lớp, tự gán học sinh
   */
  async generateSectionForClass(classId: number, semesterId: number) {
    return await this.prisma.$transaction(async (tx) => {
      // 1. Lấy dữ liệu Học kỳ
      const semester = await tx.semester.findUnique({
        where: { id: semesterId },
      });
      if (!semester) {
        throw new NotFoundException(
          `Không tìm thấy học kỳ với ID ${semesterId}`,
        );
      }

      // 2. Tìm thông tin Lớp học
      const classDto = await tx.class.findUnique({
        where: { id: classId },
      });
      if (!classDto) {
        throw new NotFoundException(`Không tìm thấy lớp học với ID ${classId}`);
      }

      // 3. Lấy khung chương trình (Curriculum) thuộc khóa học của lớp này
      const curriculum = await tx.curriculum.findFirst({
        where: {
          batch: {
            classes: {
              some: { id: classId },
            },
          },
        },
      });
      if (!curriculum) {
        throw new BadRequestException(
          "Lớp học chưa được gắn khung chương trình đào tạo!",
        );
      }

      // 4. Tìm khóa học (Batch) của lớp để lấy năm bắt đầu
      const batch = await tx.batch.findFirst({
        where: {
          classes: {
            some: { id: classId },
          },
        },
      });

      // 5. Tính học kỳ hiện tại là học kỳ số mấy trong chương trình khung
      const startYear = batch?.startYear || 0;
      const currentYear = semester?.year || 0;
      const currentTerm = semester?.term || 0;

      const semesterNo =
        startYear > 0 && currentYear >= startYear
          ? (currentYear - startYear) * 2 + currentTerm
          : 0;

      if (semesterNo === 0) {
        throw new BadRequestException(
          "Tính toán số học kỳ chương trình khung không hợp lệ!",
        );
      }

      // 6. Lấy danh sách môn học ở học kỳ này
      const curriculumSubjects = await tx.curriculumSubject.findMany({
        where: {
          curriculumId: curriculum?.id,
          semesterNumber: semesterNo,
        },
        include: {
          subject: true,
        },
      });

      if (curriculumSubjects.length === 0) {
        return {
          message: `Học kỳ này (HK ${semesterNo}) trong khung chương trình không có môn học nào được chỉ định định sẵn.`,
          generatedCoursesCount: 0,
        };
      }

      // 7. Sinh lớp học phần cho từng môn học và lưu lại danh sách ID lớp học phần vừa tạo
      const generatedCourseOffers: any[] = [];

      for (const cs of curriculumSubjects) {
        const generatedCode = `${cs.subject.subjectCode}-${classDto?.classCode}-${semester.name}`;
        const courseName = `${cs.subject.subjectName} (Lớp ${classDto?.className || classId})`;

        const existingCourseOffer = await tx.courseOffer.findUnique({
          where: { courseCode: generatedCode },
        });

        if (existingCourseOffer) {
          continue;
        }

        const courseOffer = await tx.courseOffer.create({
          data: {
            courseCode: generatedCode,
            subjectId: cs.subjectId,
            semesterId: semesterId,
            classId: classId || null,
            maxStudents: classDto?.maxStudents || 40,
            courseName: courseName,
            status: "open",
          },
        });

        generatedCourseOffers.push(courseOffer);
      }

      // 8. Tìm toàn bộ danh sách học sinh thuộc lớp học này
      const studentsInClass = await tx.student.findMany({
        where: { classId: classId },
        select: { id: true },
      });

      // 9. Tự động chuẩn bị data đăng ký cho tất cả học sinh vào các lớp học phần vừa tạo
      if (studentsInClass.length > 0 && generatedCourseOffers.length > 0) {
        const courseRegistrationsToCreate: any[] = [];

        for (const student of studentsInClass) {
          for (const course of generatedCourseOffers) {
            courseRegistrationsToCreate.push({
              studentId: student.id,
              courseOfferId: course.id,
              status: "registered",
            });
          }
        }

        // 10. Tiến hành ghi hàng loạt (Bulk Insert) vào database
        await tx.courseRegistration.createMany({
          data: courseRegistrationsToCreate,
          skipDuplicates: true, // Bỏ qua nếu bản ghi đã tồn tại nhằm tránh lỗi Unique Constraint
        });
      }

      return {
        success: true,
        message: `Sinh dữ liệu thành công cho lớp ${classDto.className}. Có ${generatedCourseOffers.length} 
        lớp học phần được tạo`,
        details: {
          semesterNumber: semesterNo,
          coursesCreated: generatedCourseOffers.length,
          studentsRegistered: studentsInClass.length,
          totalRegistrations:
            studentsInClass.length * generatedCourseOffers.length,
        },
      };
    });
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
