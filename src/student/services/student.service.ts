import { Injectable, NotFoundException, BadRequestException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import {
  AssignStudentsToClassesDto,
  CreateStudentDto,
  FindOneStudentDto,
  SearchStudentDto,
  UpdateStudentDto,
} from "../dtos/student.dto.js";
import {
  DocumentStatus,
  Prisma,
  StudentStatus,
  RoleType,
  ExamEligibilityStatus,
} from "../../../prisma/generated/prisma/client.js";
import { plainToInstance } from "class-transformer";
import bcrypt from "bcryptjs";
import { StudentDetailDto } from "../dtos/student.response.js";

@Injectable()
export class StudentService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateStudentDto) {
    const existingStudent = await this.prisma.student.findFirst({
      where: {
        OR: [{ studentCode: dto.studentCode }, { identityNumber: dto.identityNumber }, { userId: dto.userId }],
      },
    });

    if (existingStudent) {
      throw new ConflictException("Mã học sinh, CCCD hoặc User ID đã tồn tại trong hệ thống");
    }

    return this.prisma.student.create({
      data: dto,
      include: {
        user: true,
        batch: true,
        major: true,
        class: true,
      },
    });
  }

  /**
   * Sinh Sinh viên + User từ hồ sơ trúng tuyển nhập học (ENROLLED)
   */
  async createStudentFromAdmissionProfile(admissionProfileId: number, tx?: Prisma.TransactionClient) {
    const db = tx || this.prisma;

    const profile = await db.admissionProfile.findUnique({
      where: { id: admissionProfileId },
      include: {
        admissionCampaignMajor: true,
      },
    });

    if (!profile) {
      throw new NotFoundException(`Hồ sơ tuyển sinh ID ${admissionProfileId} không tồn tại`);
    }

    if (profile.studentId) {
      const existingStudent = await db.student.findUnique({
        where: { id: profile.studentId },
      });
      if (existingStudent) return existingStudent;
    }

    const year = new Date().getFullYear();
    const count = await db.student.count();
    const studentCode = `SV${year}${(count + 1).toString().padStart(4, "0")}`;

    let user = await db.user.findFirst({
      where: { username: profile.identityNumber },
    });

    if (!user) {
      const defaultPasswordHash = await bcrypt.hash("123456@Aa", 10);
      user = await db.user.create({
        data: {
          username: profile.identityNumber,
          passwordHash: defaultPasswordHash,
          role: RoleType.student,
        },
      });
    }

    const student = await db.student.create({
      data: {
        studentCode,
        identityNumber: profile.identityNumber,
        userId: user.id,
        majorId: profile.admissionCampaignMajor.majorId,
        batchId: profile.admissionCampaignMajor.batchId,
        educationLevel: profile.educationLevel,
        status: StudentStatus.STUDYING,
        enrollmentDate: new Date(),
        fullName: profile.fullName,
        email: profile.email,
        gender: profile.gender,
        dob: profile.dob,
        phone: profile.phone,
      },
    });

    return student;
  }

  async deleteStudentById(id: number) {
    return this.prisma.student.delete({
      where: { id },
    });
  }

  async createManyStudents(data: CreateStudentDto[]) {
    const timestampPart = Date.now().toString().slice(-7);

    const formatToVnTimezone = (dateInput: any) => {
      if (!dateInput) return null;
      const dateStr = typeof dateInput === "string" ? dateInput.split("T")[0] : dateInput;
      return new Date(`${dateStr}T00:00:00.000+07:00`);
    };

    const createdStudents = await this.prisma.student.createMany({
      data: data.map((item, i) => {
        const randomPart = Math.floor(10 + Math.random() * 90).toString();
        return {
          ...item,
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

  async findOne(query: FindOneStudentDto): Promise<StudentDetailDto> {
    const { id, identityNumber, studentCode } = query;

    if (!id && !identityNumber && !studentCode) {
      throw new BadRequestException("Cần truyền ít nhất một trong các tham số: id, identityNumber, hoặc studentCode");
    }

    const whereCondition: any = {};
    if (id) {
      whereCondition.id = Number(id);
    } else if (identityNumber) {
      whereCondition.identityNumber = identityNumber;
    } else if (studentCode) {
      whereCondition.studentCode = studentCode;
    }

    const student = await this.prisma.student.findFirst({
      where: whereCondition,
      include: {
        user: true,
        batch: { select: { id: true, batchCode: true, batchName: true } },
        class: { select: { id: true, classCode: true, className: true } },
        major: { select: { id: true, majorCode: true, majorName: true } },
      },
    });

    if (!student) {
      throw new NotFoundException("Không tìm thấy sinh viên");
    }

    return plainToInstance(StudentDetailDto, student);
  }

  async update(id: number, dto: UpdateStudentDto) {
    await this.findOne({ id });

    return this.prisma.student.update({
      where: { id },
      data: dto,
      include: {
        batch: true,
        major: true,
        class: true,
      },
    });
  }

  // Lấy danh sách học sinh đủ điều kiện phân lớp
  async getEligibleStudentsForAssignment(batchId: number) {
    const numericBatchId = Number(batchId);

    const where: Prisma.StudentWhereInput = {
      batchId: numericBatchId,
      classId: null,
      status: StudentStatus.STUDYING,
    };

    const [total, students] = await Promise.all([
      this.prisma.student.count({ where }),
      this.prisma.student.findMany({
        where,
        include: {
          user: true,
          batch: true,
          class: { select: { id: true, classCode: true, className: true } },
          major: { select: { id: true, majorCode: true, majorName: true } },
          admissionProfile: {
            include: {
              // Cần lấy minConduct/cutoffScore/minTotalScore đã cấu hình cho ngành + hệ
              // mà thí sinh này trúng tuyển, để so sánh thay vì hardcode ngưỡng.
              admissionCampaignMajor: {
                select: { minConduct: true, cutoffScore: true, minTotalScore: true },
              },
              documents: {
                where: { status: DocumentStatus.APPROVED },
                select: { documentConfigItemId: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      data: students,
      total,
    };
  }

  async assignStudentsToClasses(body: AssignStudentsToClassesDto) {
    const { batchId, studentsPerClass = 40 } = body;
    const numericBatchId = Number(batchId);

    return this.prisma.$transaction(async (tx) => {
      const batch = await tx.batch.findUnique({
        where: { id: numericBatchId },
        select: { id: true, batchCode: true, majorId: true },
      });

      if (!batch) {
        throw new NotFoundException(`Không tìm thấy Khóa đào tạo với ID ${numericBatchId}`);
      }

      let studentsPool = await tx.student.findMany({
        where: {
          batchId: numericBatchId,
          classId: null,
          status: StudentStatus.STUDYING,
        },
        orderBy: { fullName: "asc" },
      });

      if (studentsPool.length === 0) {
        throw new BadRequestException("Không có học sinh mới nào cần phân lớp.");
      }

      const existingClasses = await tx.class.findMany({
        where: { batchId: numericBatchId },
        orderBy: { classCode: "asc" },
      });

      const letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"];
      const resultDetails: Array<{
        classId: number;
        classCode: string;
        assignedCount: number;
        note: string;
      }> = [];

      for (const cls of existingClasses) {
        if (studentsPool.length === 0) break;

        const currentCount = await tx.student.count({
          where: { classId: cls.id },
        });

        const maxLimit = cls.maxStudents || studentsPerClass;
        const needed = maxLimit - currentCount;

        if (needed > 0) {
          const assignedStudents = studentsPool.slice(0, needed);
          studentsPool = studentsPool.slice(needed);
          const studentIds = assignedStudents.map((s) => s.id);

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

      let maxLetterIdx = -1;
      existingClasses.forEach((cls) => {
        const lastChar = cls.classCode.slice(-1).toUpperCase();
        const idx = letters.indexOf(lastChar);
        if (idx > maxLetterIdx) maxLetterIdx = idx;
      });

      let classCounter = maxLetterIdx + 1;

      while (studentsPool.length > 0) {
        const assignedStudents = studentsPool.slice(0, studentsPerClass);
        studentsPool = studentsPool.slice(studentsPerClass);
        const studentIds = assignedStudents.map((s) => s.id);

        let classCode = "";
        let className = "";
        let isUnique = false;

        while (!isUnique) {
          const suffix = letters[classCounter] || `LOP-${classCounter + 1}`;
          classCode = `${batch.batchCode}${suffix}`.toUpperCase().replace(/\s+/g, "");
          className = `${batch.batchCode} ${suffix}`;

          const duplicateCheck = await tx.class.findFirst({
            where: { classCode },
          });

          if (!duplicateCheck) {
            isUnique = true;
          } else {
            classCounter++;
          }
        }

        const newClass = await tx.class.create({
          data: {
            classCode,
            className,
            majorId: batch.majorId,
            batchId: batch.id,
            maxStudents: studentsPerClass,
            currentSize: studentIds.length,
            formTeacherId: null,
          },
        });

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
        message: "Phân lớp học sinh thành công!",
        totalAssigned: resultDetails.reduce((sum, item) => sum + item.assignedCount, 0),
        details: resultDetails,
      };
    });
  }

  async searchStudents(query: SearchStudentDto) {
    const {
      page = 1,
      limit = 10,
      studentCode,
      identityNumber,
      fullName,
      phone,
      email,
      status,
      batchId,
      majorId,
      classId,
    } = query;

    const numericPage = Number(page) || 1;
    const numericLimit = Number(limit) || 10;
    const skip = (numericPage - 1) * numericLimit;

    const where: Prisma.StudentWhereInput = {
      AND: [
        studentCode ? { studentCode: { contains: studentCode, mode: "insensitive" } } : {},
        identityNumber ? { identityNumber: { contains: identityNumber, mode: "insensitive" } } : {},
        fullName ? { fullName: { contains: fullName, mode: "insensitive" } } : {},
        phone ? { phone: { contains: phone, mode: "insensitive" } } : {},
        email ? { email: { contains: email, mode: "insensitive" } } : {},
        status ? { status } : {},
        batchId ? { batchId: Number(batchId) } : {},
        majorId ? { majorId: Number(majorId) } : {},
        classId ? { classId: Number(classId) } : {},
      ],
    };

    const [total, students] = await Promise.all([
      this.prisma.student.count({ where }),
      this.prisma.student.findMany({
        where,
        include: {
          user: true,
          batch: true,
          major: { select: { id: true, majorCode: true, majorName: true } },
          class: { select: { id: true, classCode: true, className: true } },
          admissionProfile: {
            include: {
              admissionCampaignMajor: {
                select: { minConduct: true, cutoffScore: true, minTotalScore: true },
              },
              documents: {
                where: { status: DocumentStatus.APPROVED },
                select: { documentConfigItemId: true },
              },
            },
          },
        },
        skip,
        take: numericLimit,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      data: students,
      total,
    };
  }

  async getStudentsForExam(classSubjectId: number) {
    const classSubject = await this.prisma.classSubject.findUnique({
      where: { id: classSubjectId },
      include: {
        subject: true,
      },
    });

    if (!classSubject) {
      throw new NotFoundException(`Lớp học phần với ID ${classSubjectId} không tồn tại.`);
    }

    // 2. Lấy danh sách GradeStudent thuộc ClassSubject
    // (Bảng GradeStudent quản lý danh sách học sinh và điểm số của môn học đó)
    const gradeStudents = await this.prisma.gradeStudent.findMany({
      where: { classSubjectId },
      include: {
        student: true,
      },
      orderBy: {
        student: {
          fullName: "asc",
        },
      },
    });

    if (gradeStudents.length === 0) {
      return [];
    }

    const studentIds = gradeStudents.map((gs) => gs.studentId);

    // 3. Lấy dữ liệu tổng hợp điểm danh từ bảng AttendanceSummary
    const attendanceSummaries = await this.prisma.attendanceSummary.findMany({
      where: {
        classSubjectId,
        studentId: { in: studentIds },
      },
    });

    // Tạo Map để tra cứu AttendanceSummary theo studentId cho nhanh
    const summaryMap = new Map(attendanceSummaries.map((s) => [s.studentId, s]));

    // 4. Map dữ liệu trả về cho client
    const result = gradeStudents.map((gs) => {
      const student = gs.student;
      const summary = summaryMap.get(student.id);

      // Tính toán các con số điểm danh
      const totalPeriods = summary?.totalPeriods ?? 0;
      const absentPeriods = summary?.totalAbsentPeriods ?? 0;
      const absentPercentage = summary?.absentPercentage ?? 0;
      let examStatus = summary?.examStatus ?? ExamEligibilityStatus.ELIGIBLE;
      const isManuallyLocked = summary?.isManuallyLocked ?? false;
      const lockReason = summary?.lockReason ?? null;

      // quy định: Vắng quá 20% và diemTB <=5 thì CẤM THI
      if (!isManuallyLocked && totalPeriods > 0) {
        if (absentPercentage > 20 && (gs?.diemTB || 0) <= 5) {
          examStatus = ExamEligibilityStatus.INELIGIBLE;
        } else {
          examStatus = ExamEligibilityStatus.ELIGIBLE;
        }
      }

      return {
        id: student.id,
        studentCode: student.studentCode,
        fullName: student.fullName,
        phone: student.phone,
        gender: student.gender,
        dob: student.dob,

        // Thông tin điểm số
        diemTB: gs.diemTB,

        // Thông tin chuyên cần
        totalPeriods,
        absentPeriods,
        absentPercentage,
        examStatus,
        isManuallyLocked,
        lockReason,
      };
    });

    return result;
  }
}
