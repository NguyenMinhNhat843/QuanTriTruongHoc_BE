import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import {
  ApprovedStudentDto,
  CreateStudentDto,
  SearchStudentDto,
  UpdateStudentDto,
} from "./dto/student.dto.js";
import {
  QualifiedStudentResponseDto,
  ResponseStudentPaginationDto,
  StudentResponseDto,
} from "./dto/student.response.js";
import { Prisma } from "../../prisma/generated/prisma/client.js";
import { generateId } from "../utils/generateId.js";
import { plainToInstance } from "class-transformer";
import { AssignStudentsToClassesDto } from "./dto/get-eligible-students.dto.js";

@Injectable()
export class StudentService {
  constructor(private prisma: PrismaService) {}

  /**
   * Tạo mới một sinh viên
   */
  async createStudent(data: CreateStudentDto): Promise<StudentResponseDto> {
    const { admissionProfile, ...studentProfile } = data;

    const student = await this.prisma.$transaction(async (tx) => {
      const newStudent = await tx.student.create({
        data: {
          ...studentProfile,
          studentCode: `S${generateId()}`,
          dob: studentProfile.dob ? new Date(studentProfile.dob) : null,
        },
      });

      if (admissionProfile) {
        await tx.admissionProfile.create({
          data: {
            ...admissionProfile,
            studentId: newStudent.id,
            gpa6: admissionProfile.gpa6 ?? 0,
            gpa7: admissionProfile.gpa7 ?? 0,
            gpa8: admissionProfile.gpa8 ?? 0,
            gpa9: admissionProfile.gpa9 ?? 0,
          },
        });
      }

      return newStudent;
    });

    return plainToInstance(StudentResponseDto, student);
  }

  async deleteStudentById(id: number) {
    return await this.prisma.student.delete({
      where: { id },
    });
  }

  /**
   * Tạo nhiều sinh viên
   */
  async createManyStudents(data: CreateStudentDto[]) {
    const timestampPart = Date.now().toString().slice(-7);

    // Hàm helper để chuẩn hóa chuỗi ngày tháng về múi giờ VN (+07:00)
    const formatToVnTimezone = (dateInput: any) => {
      if (!dateInput) return null;

      // Nếu là chuỗi, lấy 10 ký tự đầu (YYYY-MM-DD)
      const dateStr =
        typeof dateInput === "string" ? dateInput.split("T")[0] : dateInput;

      // Ép về định dạng ISO chuẩn múi giờ +07:00
      return new Date(`${dateStr}T00:00:00.000+07:00`);
    };

    const createdStudents = await this.prisma.student.createMany({
      data: data.map((item, i) => {
        const randomPart = Math.floor(10 + Math.random() * 90).toString();

        return {
          ...item,
          // Ép kiểu Date chính xác cho ngày sinh và các ngày liên quan
          dob: formatToVnTimezone(item.dob),
          enrollmentDate: formatToVnTimezone(item.enrollmentDate),
          graduationDate: formatToVnTimezone(item.graduationDate),

          studentCode: `S${timestampPart}${randomPart}${i}`,
        };
      }),
      skipDuplicates: true,
    });

    return {
      message: `Đã tạo thành công ${createdStudents.count} sinh viên`,
      status: true,
    };
  }

  /**
   * Tìm sinh viên theo mã sinh viên
   */
  async findOne(studentCode: string): Promise<StudentResponseDto> {
    const idAsNumber = Number(studentCode);
    const isIdNumber = !isNaN(idAsNumber);

    const student = await this.prisma.student.findFirst({
      where: {
        OR: [
          { studentCode: studentCode },
          ...(isIdNumber ? [{ id: idAsNumber }] : []),
        ],
      },
      include: {
        user: true,
        batch: {
          select: {
            id: true,
            batchCode: true,
            batchName: true,
          },
        },
        class: {
          select: {
            id: true,
            classCode: true,
            className: true,
          },
        },
        major: {
          select: {
            id: true,
            majorCode: true,
            majorName: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException("Không tìm thấy sinh viên");
    }

    return plainToInstance(StudentResponseDto, student);
  }

  /**
   * Cập nhật thông tin sinh viên
   */
  async updateStudent(
    id: number,
    data: UpdateStudentDto,
  ): Promise<StudentResponseDto> {
    // 1. Kiểm tra sinh viên có tồn tại hay không
    const studentExists = await this.prisma.student.findUnique({
      where: { id },
    });

    if (!studentExists) {
      throw new NotFoundException("Không tìm thấy sinh viên cần cập nhật");
    }

    const { admissionProfile, ...studentProfile } = data;

    // 2. Sử dụng $transaction để đảm bảo tính toàn vẹn dữ liệu
    const updatedStudent = await this.prisma.$transaction(async (tx) => {
      // Cập nhật thông tin cơ bản của Student
      const student = await tx.student.update({
        where: { id },
        data: {
          ...studentProfile,
          dob: studentProfile.dob ? new Date(studentProfile.dob) : undefined,
        },
      });

      // 3. Xử lý cập nhật hoặc tạo mới AdmissionProfile nếu dữ liệu được truyền lên
      if (admissionProfile) {
        await tx.admissionProfile.upsert({
          where: { studentId: id },
          update: {
            ...admissionProfile,
          },
          create: {
            ...admissionProfile,
            studentId: id,
            // Sử dụng giá trị fallback tương tự như hàm create phòng trường hợp tạo mới
            gpa6: admissionProfile.gpa6 ?? 0,
            gpa7: admissionProfile.gpa7 ?? 0,
            gpa8: admissionProfile.gpa8 ?? 0,
            gpa9: admissionProfile.gpa9 ?? 0,
          },
        });
      }

      return student;
    });

    // 4. Nếu bạn cần include thêm thông tin (như `user: true` ở code cũ của bạn)
    // để map vào StudentResponseDto, ta nên query lại hoặc include trực tiếp trong lệnh update ở trên.
    const finalResult = await this.prisma.student.findUnique({
      where: { id: updatedStudent.id },
      include: {
        user: true,
        admissionProfile: true, // Thường Dto response sẽ cần cả cái này
      },
    });

    return plainToInstance(StudentResponseDto, finalResult);
  }

  /**
   * Duyệt hồ sơ và cấp tài khoản cho sinh viên
   */
  async approveStudent(body: ApprovedStudentDto) {
    const { quote } = body;

    // 1. Lấy TẤT CẢ học sinh kèm học bạ để lọc (chỉ lấy những bạn chưa được approved để tránh duyệt trùng)
    const students = await this.prisma.student.findMany({
      where: {
        status: "pending", // Hoặc lọc theo trạng thái chờ duyệt cụ thể của bạn, ví dụ: status: "pending"
      },
      include: {
        admissionProfile: true,
      },
    });

    if (students.length === 0) {
      throw new NotFoundException("Không tìm thấy học sinh nào cần xét duyệt");
    }

    const validConducts = ["KHA", "TOT"];

    // 2. Lọc các học sinh THỰC SỰ ĐỦ ĐIỀU KIỆN và tính điểm trung bình (avgGpa) trực tiếp
    const qualifiedStudents = students
      .map((student) => {
        const profile = student.admissionProfile;
        if (!profile) return null;

        const isConductPassed =
          validConducts.includes(profile.conduct6) &&
          validConducts.includes(profile.conduct7) &&
          validConducts.includes(profile.conduct8) &&
          validConducts.includes(profile.conduct9);

        const avgGpa =
          (profile.gpa6 + profile.gpa7 + profile.gpa8 + profile.gpa9) / 4;

        // Điều kiện đạt: GPA trung bình > 5 và hạnh kiểm đạt
        if (avgGpa > 5 && isConductPassed) {
          return { id: student.id, avgGpa };
        }
        return null;
      })
      .filter((s): s is { id: number; avgGpa: number } => s !== null);

    if (qualifiedStudents.length === 0) {
      throw new BadRequestException(
        "Không có học sinh nào đủ điều kiện trúng tuyển",
      );
    }

    // 3. Sắp xếp học sinh đủ điều kiện theo GPA từ CAO xuống THẤP
    qualifiedStudents.sort((a, b) => b.avgGpa - a.avgGpa);

    // 4. Áp dụng chỉ tiêu (quote) nếu có truyền vào và quote hợp lệ (> 0)
    // Nếu không truyền quote hoặc quote <= 0, lấy toàn bộ (all)
    const finalSelection =
      quote && quote > 0
        ? qualifiedStudents.slice(0, quote)
        : qualifiedStudents;

    const targetStudentIds = finalSelection.map((s) => s.id);

    // 5. Cập nhật trạng thái hàng loạt cho các học sinh trúng tuyển theo chỉ tiêu
    await this.prisma.student.updateMany({
      where: {
        id: { in: targetStudentIds },
      },
      data: {
        status: "approved",
      },
    });

    return {
      success: true,
      message: `Đã duyệt thành công ${targetStudentIds.length} học sinh có điểm từ cao xuống thấp vào trạng thái trúng tuyển.`,
      approvedCount: targetStudentIds.length,
    };
  }

  /**
   * Lấy danh sách học sinh đủ điều kiện phân lớp
   */
  async getEligibleStudentsForAssignment(
    batchId: number,
  ): Promise<ResponseStudentPaginationDto> {
    // 1. Lấy cấu hình hồ sơ mẫu (id = 1) để tính toán documentProgress
    const docConfig = await this.prisma.documentConfig.findUnique({
      where: { id: 1 },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    const totalConfigItems = docConfig?.items || [];
    const totalRequiredDocs = totalConfigItems.length;

    // 2. Xây dựng điều kiện lọc cứng theo yêu cầu
    const where: Prisma.StudentWhereInput = {
      AND: [
        { batchId: Number(batchId) },
        { classId: null }, // Sinh viên chưa được xếp lớp
        {
          status: {
            in: ["approved", "studying"],
          },
        },
      ],
    };

    // 3. Thực thi truy vấn đồng thời: Đếm tổng số lượng và Lấy danh sách dữ liệu
    const [total, items] = await Promise.all([
      this.prisma.student.count({ where }),
      this.prisma.student.findMany({
        where,
        include: {
          user: true,
          batch: true,
          class: {
            select: {
              classCode: true,
            },
          },
          admissionProfile: true,
          student_documents: {
            select: {
              documentConfigItemId: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // 4. Map dữ liệu để tính toán tiến độ hồ sơ và tiêu chí đạt (isQualified)
    const formattedItems = items.map((item) => {
      const submittedItemIds = new Set(
        item.student_documents.map((doc) => doc.documentConfigItemId),
      );

      const currentDocsCount = totalConfigItems.filter((configItem) =>
        submittedItemIds.has(configItem.id),
      ).length;

      // Tính toán điều kiện xét tuyển (isQualified)
      let isQualified = false;
      const profile = item.admissionProfile;

      if (profile) {
        const avgGpa =
          (profile.gpa6 + profile.gpa7 + profile.gpa8 + profile.gpa9) / 4;
        const validConducts = ["KHA", "TOT"];
        const isConductPassed =
          validConducts.includes(profile.conduct6) &&
          validConducts.includes(profile.conduct7) &&
          validConducts.includes(profile.conduct8) &&
          validConducts.includes(profile.conduct9);

        isQualified = avgGpa > 5 && isConductPassed;
      }

      return {
        ...item,
        documentProgress: {
          current: currentDocsCount,
          total: totalRequiredDocs,
        },
        isQualified,
      };
    });

    // Khúc biến đổi danh sách bằng plainToInstance theo DTO QualifiedStudentResponseDto
    const students = formattedItems.map((item) =>
      plainToInstance(QualifiedStudentResponseDto, item),
    );

    // 5. Trả về đúng cấu trúc ResponseStudentPaginationDto cho FE
    return {
      students,
      total,
    };
  }

  /**
   * Phân lớp cho học sinh
   */
  async assignStudentsToClasses(body: AssignStudentsToClassesDto) {
    const { batchId, studentsPerClass = 40 } = body;

    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
    });
    if (!batch)
      throw new NotFoundException(
        `Không tìm thấy Khóa đào tạo với ID ${batchId}`,
      );
    const majorId = batch.majorId;

    // 1. Lấy danh sách học sinh chưa có lớp
    let studentsPool = await this.prisma.student.findMany({
      where: {
        batchId,
        classId: null,
        status: {
          in: ["approved", "studying"],
        },
      },
      orderBy: { fullName: "asc" },
    });
    const abc = await this.prisma.student.findMany();
    console.log(`Tổng số sinh viên cần phân lớp: ${studentsPool.length}`);
    console.log(`Tổng số sinh viên trong hệ thống: ${abc.length}`);

    if (studentsPool.length === 0)
      throw new BadRequestException("Không có sinh viên mới nào cần phân lớp.");

    // 2. Lấy các lớp hiện có của khóa để ƯU TIÊN LẤP ĐẦY TRƯỚC
    const existingClasses = await this.prisma.class.findMany({
      where: { batchId, status: "ACTIVE" },
      orderBy: { classCode: "asc" },
    });

    const letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"];
    const resultDetails: any = [];

    return await this.prisma.$transaction(async (tx) => {
      // BƯỚC 1: Duyệt qua các lớp cũ, xem lớp nào thiếu thì SLICE học sinh bù vào cho ĐẦY
      for (const cls of existingClasses) {
        if (studentsPool.length === 0) break;

        const currentCount = await tx.student.count({
          where: { classId: cls.id },
        });
        const maxLimit = cls.maxStudents || studentsPerClass;
        const needed = maxLimit - currentCount;

        if (needed > 0) {
          // Cắt đúng số lượng đứa đang thiếu để nạp vào lớp này
          const assignedStudents = studentsPool.slice(0, needed);
          studentsPool = studentsPool.slice(needed); // Cắt bỏ những đứa đã được xếp ra khỏi hàng chờ

          const studentIds = assignedStudents.map((s) => s.id);

          // Update DB luôn
          await tx.class.update({
            where: { id: cls.id },
            data: { currentSize: currentCount + studentIds.length },
          });

          await tx.student.updateMany({
            where: { id: { in: studentIds } },
            data: { classId: cls.id },
          });

          resultDetails.push({
            classId: cls.id,
            classCode: cls.classCode,
            assignedCount: studentIds.length,
            note: `Lấp đầy lớp cũ thành công (Sĩ số mới: ${currentCount + studentIds.length}/${maxLimit})`,
          });
        }
      }

      // BƯỚC 2: Nếu vẫn còn dư học sinh, cứ CHẶT TỪNG KHÚC 40 ĐỨA rồi TẠO LỚP MỚI
      let maxLetterIdx = -1;
      existingClasses.forEach((cls) => {
        const lastChar = cls.classCode.slice(-1).toUpperCase();
        const idx = letters.indexOf(lastChar);
        if (idx > maxLetterIdx) maxLetterIdx = idx;
      });
      let classCounter = maxLetterIdx + 1;

      while (studentsPool.length > 0) {
        // Cắt đúng 40 đứa tiếp theo (hoặc phần còn lại cuối cùng nếu ít hơn 40)
        const assignedStudents = studentsPool.slice(0, studentsPerClass);
        studentsPool = studentsPool.slice(studentsPerClass);

        const studentIds = assignedStudents.map((s) => s.id);

        // Tạo mã lớp tăng tiến (A, B, C...)
        let classCode = "";
        let className = "";
        let isUnique = false;

        while (!isUnique) {
          const suffix = letters[classCounter] || `Lớp-${classCounter + 1}`;
          classCode = `${batch.batchCode}${suffix}`
            .toUpperCase()
            .replace(/\s+/g, "");
          className = `${batch.batchCode} ${suffix}`;

          const duplicateCheck = await tx.class.findUnique({
            where: { classCode },
          });
          if (!duplicateCheck) isUnique = true;
          else classCounter++;
        }

        // Tạo luôn lớp mới vào DB
        const newClass = await tx.class.create({
          data: {
            classCode,
            className,
            majorId,
            batchId: batch.id,
            maxStudents: studentsPerClass,
            currentSize: studentIds.length,
            status: "active",
            formTeacherId: null,
          },
        });

        // Cập nhật học sinh sang lớp mới
        await tx.student.updateMany({
          where: { id: { in: studentIds } },
          data: { classId: newClass.id },
        });

        resultDetails.push({
          classId: newClass.id,
          classCode,
          assignedCount: studentIds.length,
          note: `Tạo lớp mới thành công (Sĩ số: ${studentIds.length}/${studentsPerClass})`,
        });

        classCounter++;
      }

      return {
        message: "Phân lớp bằng phương pháp cắt mảng hoàn tất!",
        details: resultDetails,
      };
    });
  }

  /**
   * Search student theo tham số truyền vào
   */
  async searchStudents(
    query: SearchStudentDto,
  ): Promise<ResponseStudentPaginationDto> {
    const {
      page = 1,
      limit = 1000,
      keyword,
      status,
      excludeStatus,
      classId,
      batchId,
      majorId,
      fromDate,
      toDate,
      sortBy = "createdAt",
      sortOrder = "desc",
      studentCode,
    } = query;

    const skip = (page - 1) * limit;

    // 1. Lấy cấu hình hồ sơ mẫu (id = 1) làm mốc đối chiếu mẫu
    const docConfig = await this.prisma.documentConfig.findUnique({
      where: { id: 1 },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    const totalConfigItems = docConfig?.items || [];
    const totalRequiredDocs = totalConfigItems.length;

    // 2. Xây dựng điều kiện lọc (Where Clause)
    const where: Prisma.StudentWhereInput = {
      AND: [
        keyword
          ? {
              OR: [
                { studentCode: { contains: keyword, mode: "insensitive" } },
                { identityNumber: { contains: keyword, mode: "insensitive" } },
                { email: { contains: keyword, mode: "insensitive" } },
                { fullName: { contains: keyword, mode: "insensitive" } },
                { phone: { contains: keyword, mode: "insensitive" } },
              ],
            }
          : {},
        status
          ? excludeStatus
            ? { status: { not: status } } // NOT pending
            : { status } // pending
          : {},
        classId ? { classId } : {},
        batchId ? { batchId: Number(batchId) } : {},
        majorId
          ? {
              batch: {
                majorId: Number(majorId),
              },
            }
          : {},
        fromDate || toDate
          ? {
              enrollmentDate: {
                ...(fromDate && { gte: new Date(fromDate) }),
                ...(toDate && { lte: new Date(toDate) }),
              },
            }
          : {},
        studentCode
          ? { studentCode: { contains: studentCode, mode: "insensitive" } }
          : {},
      ],
    };

    // 3. Thực thi truy vấn đồng thời - ĐÃ HỨNG BIẾN total ĐỂ LÀM PHÂN TRANG
    const [total, items] = await Promise.all([
      this.prisma.student.count({ where }),
      this.prisma.student.findMany({
        where,
        include: {
          user: true,
          batch: true,
          class: {
            select: {
              classCode: true,
            },
          },
          admissionProfile: true,
          student_documents: {
            select: {
              documentConfigItemId: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: sortBy.includes(".")
          ? { [sortBy.split(".")[0]]: { [sortBy.split(".")[1]]: sortOrder } }
          : { [sortBy]: sortOrder },
      }),
    ]);

    // 4. Map dữ liệu để tính toán thực tế hồ sơ hiện có và check tiêu chí đạt
    const formattedItems = items.map((item) => {
      const submittedItemIds = new Set(
        item.student_documents.map((doc) => doc.documentConfigItemId),
      );

      const currentDocsCount = totalConfigItems.filter((configItem) =>
        submittedItemIds.has(configItem.id),
      ).length;

      // Tính toán điều kiện xét tuyển (isQualified)
      let isQualified = false;
      const profile = item.admissionProfile;

      if (profile) {
        const avgGpa =
          (profile.gpa6 + profile.gpa7 + profile.gpa8 + profile.gpa9) / 4;
        const validConducts = ["KHA", "TOT"];
        const isConductPassed =
          validConducts.includes(profile.conduct6) &&
          validConducts.includes(profile.conduct7) &&
          validConducts.includes(profile.conduct8) &&
          validConducts.includes(profile.conduct9);

        isQualified = avgGpa > 5 && isConductPassed;
      }

      return {
        ...item,
        documentProgress: {
          current: currentDocsCount,
          total: totalRequiredDocs,
        },
        isQualified,
      };
    });

    // Khúc biến đổi danh sách bằng plainToInstance theo DTO QualifiedStudentResponseDto
    const students = formattedItems.map((item) =>
      plainToInstance(QualifiedStudentResponseDto, item),
    );

    // 5. Trả về đúng cấu trúc ResponseStudentPaginationDto
    return {
      students,
      total,
    };
  }
}
