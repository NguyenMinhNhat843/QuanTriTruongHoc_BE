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
  QualifiedStudentResponseDto,
  ResponseStudentPaginationDto,
  StudentResponseDto,
} from "../dtos/student.response.js";
import {
  Conduct,
  DocumentStatus,
  Prisma,
  StudentStatus,
  RoleType,
  EducationLevel,
} from "../../../prisma/generated/prisma/client.js";
import { plainToInstance } from "class-transformer";
import bcrypt from "bcryptjs";

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
  async createStudentFromAdmissionProfile(admissionProfileId: number) {
    const profile = await this.prisma.admissionProfile.findUnique({
      where: { id: admissionProfileId },
      include: {
        admissionCampaignMajor: true,
      },
    });

    if (!profile) {
      throw new NotFoundException(`Hồ sơ tuyển sinh ID ${admissionProfileId} không tồn tại`);
    }

    if (profile.studentId) {
      const existingStudent = await this.prisma.student.findUnique({
        where: { id: profile.studentId },
      });
      if (existingStudent) return existingStudent;
    }

    const year = new Date().getFullYear();
    const count = await this.prisma.student.count();
    const studentCode = `SV${year}${(count + 1).toString().padStart(4, "0")}`;

    let user = await this.prisma.user.findFirst({
      where: { username: profile.identityNumber },
    });

    if (!user) {
      const defaultPasswordHash = await bcrypt.hash("123456@Aa", 10);
      user = await this.prisma.user.create({
        data: {
          username: profile.identityNumber,
          passwordHash: defaultPasswordHash,
          role: RoleType.student,
        },
      });
    }

    const student = await this.prisma.student.create({
      data: {
        studentCode,
        identityNumber: profile.identityNumber,
        userId: user.id,
        majorId: profile.admissionCampaignMajor.majorId,
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

  async findOne(query: FindOneStudentDto): Promise<StudentResponseDto> {
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

    return plainToInstance(StudentResponseDto, student);
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
  async getEligibleStudentsForAssignment(batchId: number): Promise<ResponseStudentPaginationDto> {
    const numericBatchId = Number(batchId);

    const where: Prisma.StudentWhereInput = {
      batchId: numericBatchId,
      classId: null,
      status: StudentStatus.STUDYING,
    };

    const [total, items] = await Promise.all([
      this.prisma.student.count({ where }),
      this.prisma.student.findMany({
        where,
        include: {
          user: true,
          batch: true,
          class: { select: { id: true, classCode: true, className: true } },
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

    const formattedItems = items.map((student) => {
      const profile = student.admissionProfile;
      let isQualified = false;

      if (profile) {
        // Lấy đúng bộ hạnh kiểm theo trình độ học vấn của thí sinh:
        // THCS -> lớp 6,7,8,9 | THPT -> lớp 10,11,12
        const conducts =
          profile.educationLevel === EducationLevel.THCS
            ? [profile.conduct6, profile.conduct7, profile.conduct8, profile.conduct9]
            : [profile.conduct10, profile.conduct11, profile.conduct12];

        const requiredConduct = profile.admissionCampaignMajor?.minConduct ?? null;
        const isConductPassed = requiredConduct
          ? conducts.every(
              (conduct): conduct is Conduct =>
                conduct !== null && conduct !== undefined && this.compareConduct(conduct, requiredConduct) >= 0,
            )
          : conducts.every((conduct) => conduct !== null && conduct !== undefined);

        // Ưu tiên điểm chuẩn (cutoffScore) nếu Phòng Đào tạo đã set sau khi duyệt hồ sơ;
        // nếu chưa có thì tạm dùng điểm sàn (minTotalScore) làm ngưỡng xét.
        const requiredScore =
          profile.admissionCampaignMajor?.cutoffScore ?? profile.admissionCampaignMajor?.minTotalScore;
        const isScorePassed = requiredScore != null && (profile.avgSubjectScore ?? 0) >= requiredScore;

        isQualified = isScorePassed && isConductPassed;
      }

      return {
        ...student,
        isQualified,
      };
    });

    const students = formattedItems.map((item) =>
      plainToInstance(QualifiedStudentResponseDto, item, { excludeExtraneousValues: false }),
    );

    return {
      students,
      total,
    };
  }

  // Hạnh kiểm: TOT > KHA > TB > YEU. So sánh conduct đạt được với mức tối thiểu yêu cầu.
  // Trả về >= 0 nếu conduct đạt hoặc vượt yêu cầu.
  private compareConduct(conduct: Conduct, minConduct: Conduct): number {
    const rank: Record<Conduct, number> = {
      [Conduct.TOT]: 4,
      [Conduct.KHA]: 3,
      [Conduct.TB]: 2,
      [Conduct.YEU]: 1,
    };
    return rank[conduct] - rank[minConduct];
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

  async searchStudents(query: SearchStudentDto): Promise<ResponseStudentPaginationDto> {
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

    // DocumentConfig không còn gắn theo đợt/hệ đào tạo nữa — chỉ cần lấy checklist
    // đang áp dụng tại thời điểm hiện tại (startDate gần nhất, <= hôm nay).
    const docConfig = await this.prisma.documentConfig.findFirst({
      where: { startDate: { lte: new Date() } },
      orderBy: { startDate: "desc" },
      include: {
        items: {
          where: { required: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    const totalConfigItems = docConfig?.items || [];
    const totalRequiredDocs = totalConfigItems.length;

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

    const [total, items] = await Promise.all([
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
              // Cần minConduct/cutoffScore/minTotalScore của ngành + hệ thí sinh
              // trúng tuyển để xét đạt/không đạt, thay vì hardcode ngưỡng.
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

    const formattedItems = items.map((student) => {
      const profile = student.admissionProfile;
      const approvedDocItemIds = new Set(profile?.documents.map((doc) => doc.documentConfigItemId) || []);
      const currentDocsCount = totalConfigItems.filter((configItem) => approvedDocItemIds.has(configItem.id)).length;

      let isQualified = false;
      if (profile) {
        // Lấy đúng bộ hạnh kiểm theo trình độ học vấn của thí sinh:
        // THCS -> lớp 6,7,8,9 | THPT -> lớp 10,11,12
        const conducts =
          profile.educationLevel === EducationLevel.THCS
            ? [profile.conduct6, profile.conduct7, profile.conduct8, profile.conduct9]
            : [profile.conduct10, profile.conduct11, profile.conduct12];

        const requiredConduct = profile.admissionCampaignMajor?.minConduct ?? null;
        const isConductPassed = requiredConduct
          ? conducts.every(
              (conduct): conduct is Conduct =>
                conduct !== null && conduct !== undefined && this.compareConduct(conduct, requiredConduct) >= 0,
            )
          : conducts.every((conduct) => conduct !== null && conduct !== undefined);

        // Ưu tiên điểm chuẩn (cutoffScore) nếu Phòng Đào tạo đã set sau khi duyệt hồ sơ;
        // nếu chưa có thì tạm dùng điểm sàn (minTotalScore) làm ngưỡng xét.
        const requiredScore =
          profile.admissionCampaignMajor?.cutoffScore ?? profile.admissionCampaignMajor?.minTotalScore;
        const isScorePassed = requiredScore != null && (profile.avgSubjectScore ?? 0) >= requiredScore;

        isQualified = isScorePassed && isConductPassed;
      }

      return {
        ...student,
        documentProgress: {
          current: currentDocsCount,
          total: totalRequiredDocs,
        },
        isQualified,
      };
    });

    const students = formattedItems.map((item) =>
      plainToInstance(QualifiedStudentResponseDto, item, { excludeExtraneousValues: false }),
    );

    return {
      students,
      total,
    };
  }
}
