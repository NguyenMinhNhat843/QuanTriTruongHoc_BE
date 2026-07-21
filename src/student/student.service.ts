import { Injectable, NotFoundException, BadRequestException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import {
  AssignStudentsToClassesDto,
  CreateStudentDto,
  FindOneStudentDto,
  SearchStudentDto,
  UpdateStudentDto,
} from "./dto/student.dto.js";
import {
  QualifiedStudentResponseDto,
  ResponseStudentPaginationDto,
  StudentResponseDto,
} from "./dto/student.response.js";
import { Conduct, DocumentStatus, Prisma, StudentStatus } from "../../prisma/generated/prisma/client.js";
import { plainToInstance } from "class-transformer";

@Injectable()
export class StudentService {
  constructor(private prisma: PrismaService) {}

  /**
   * Tạo mới học sinh
   */
  async create(dto: CreateStudentDto) {
    // Kiểm tra trùng lặp mã học sinh, CCCD hoặc userId
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
      const dateStr = typeof dateInput === "string" ? dateInput.split("T")[0] : dateInput;

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
   * Tìm sinh viên theo Ưu tiên: id -> identityNumber -> studentCode
   */
  async findOne(query: FindOneStudentDto): Promise<StudentResponseDto> {
    const { id, identityNumber, studentCode } = query;

    if (!id && !identityNumber && !studentCode) {
      throw new BadRequestException("Cần truyền ít nhất một trong các tham số: id, identityNumber, hoặc studentCode");
    }

    // Xây dựng câu điều kiện Prisma theo đúng thứ tự ưu tiên
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
   * Cập nhật thông tin học sinh
   */
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

  /**
   * Lấy danh sách học sinh đủ điều kiện phân lớp (Schema mới)
   */
  async getEligibleStudentsForAssignment(batchId: number): Promise<ResponseStudentPaginationDto> {
    const numericBatchId = Number(batchId);

    // 1. Lấy đợt tuyển sinh tương ứng với Batch để tìm cấu hình tài liệu (DocumentConfig)
    const campaign = await this.prisma.admissionCampaign.findFirst({
      where: { batchId: numericBatchId },
      select: { id: true, educationLevel: true },
    });

    // Lấy danh sách giấy tờ bắt buộc cấu hình theo Đợt hoặc Khóa học
    const docConfig = await this.prisma.documentConfig.findFirst({
      where: {
        OR: [{ admissionCampaignId: campaign?.id }, { educationLevel: campaign?.educationLevel }],
      },
      include: {
        items: {
          where: { required: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    const totalConfigItems = docConfig?.items || [];
    const totalRequiredDocs = totalConfigItems.length;

    // 2. Xây dựng điều kiện lọc Học sinh:
    // - Thuộc khóa học (batchId)
    // - Chưa được xếp lớp (classId = null)
    // - Trạng thái đang theo học (STUDYING)
    const where: Prisma.StudentWhereInput = {
      batchId: numericBatchId,
      classId: null,
      status: StudentStatus.STUDYING,
    };

    // 3. Thực thi truy vấn đồng thời
    const [total, items] = await Promise.all([
      this.prisma.student.count({ where }),
      this.prisma.student.findMany({
        where,
        include: {
          user: true,
          batch: true,
          class: {
            select: {
              id: true,
              classCode: true,
              className: true,
            },
          },
          admissionProfile: {
            include: {
              documents: {
                where: { status: DocumentStatus.APPROVED }, // Chỉ tính các giấy tờ đã duyệt
                select: {
                  documentConfigItemId: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // 4. Map dữ liệu & tính toán Tiến độ hồ sơ + Tiêu chí xét đạt (isQualified)
    const formattedItems = items.map((student) => {
      const profile = student.admissionProfile;

      // --- Tính tiến độ hồ sơ ---
      const approvedDocItemIds = new Set(profile?.documents.map((doc) => doc.documentConfigItemId) || []);

      const currentDocsCount = totalConfigItems.filter((configItem) => approvedDocItemIds.has(configItem.id)).length;

      // --- Tính tiêu chí xét tuyển đạt (isQualified) ---
      let isQualified = false;

      if (profile) {
        // Trường hợp 1: Được tuyển thẳng ➔ Đạt luôn
        if (profile.isDirectAdmission) {
          isQualified = true;
        } else {
          // Trường hợp 2: Kiểm tra Học lực (GPA) & Hạnh kiểm THCS
          const gpaList = [profile.gpa6, profile.gpa7, profile.gpa8, profile.gpa9].filter(
            (gpa): gpa is number => gpa !== null && gpa !== undefined,
          );

          const avgGpa = gpaList.length > 0 ? gpaList.reduce((sum, val) => sum + val, 0) / gpaList.length : 0;

          const validConducts: Conduct[] = [Conduct.KHA, Conduct.TOT];
          const isConductPassed =
            profile.conduct6 &&
            validConducts.includes(profile.conduct6) &&
            profile.conduct7 &&
            validConducts.includes(profile.conduct7) &&
            profile.conduct8 &&
            validConducts.includes(profile.conduct8) &&
            profile.conduct9 &&
            validConducts.includes(profile.conduct9);

          // Đạt nếu Điểm TB > 5.0 và Hạnh kiểm Khá trở lên (hoặc dựa trên scoreCalculated)
          isQualified = (avgGpa >= 5.0 && Boolean(isConductPassed)) || (profile.scoreCalculated ?? 0) >= 5.0;
        }
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

    // 5. Chuyển đổi sang DTO trả về cho FE
    const students = formattedItems.map((item) =>
      plainToInstance(QualifiedStudentResponseDto, item, { excludeExtraneousValues: false }),
    );

    return {
      students,
      total,
    };
  }

  /**
   * Tự động phân lớp cho học sinh (Bảo đảm chống Race Condition & tương thích Schema mới)
   */
  async assignStudentsToClasses(body: AssignStudentsToClassesDto) {
    const { batchId, studentsPerClass = 40 } = body;
    const numericBatchId = Number(batchId);

    // Chạy trong Transaction để đảm bảo tính toàn vẹn dữ liệu
    return await this.prisma.$transaction(async (tx) => {
      // 1. Kiểm tra Khóa đào tạo (Batch)
      const batch = await tx.batch.findUnique({
        where: { id: numericBatchId },
        select: { id: true, batchCode: true, majorId: true },
      });

      if (!batch) {
        throw new NotFoundException(`Không tìm thấy Khóa đào tạo với ID ${numericBatchId}`);
      }

      // 2. Lấy danh sách học sinh chưa có lớp trong khóa này
      let studentsPool = await tx.student.findMany({
        where: {
          batchId: numericBatchId,
          classId: null,
          status: StudentStatus.STUDYING, // Theo Enum Prisma mới
        },
        orderBy: { fullName: "asc" },
      });

      if (studentsPool.length === 0) {
        throw new BadRequestException("Không có học sinh mới nào cần phân lớp.");
      }

      // 3. Lấy danh sách lớp học hiện có của Khóa
      const existingClasses = await tx.class.findMany({
        where: {
          batchId: numericBatchId,
        },
        orderBy: { classCode: "asc" },
      });

      const letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"];
      const resultDetails: Array<{
        classId: number;
        classCode: string;
        assignedCount: number;
        note: string;
      }> = [];

      // ==========================================
      // BƯỚC 1: LẤP ĐẦY CÁC LỚP CŨ CÒN TRỐNG CHỖ
      // ==========================================
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

          // Cập nhật sĩ số lớp
          await tx.class.update({
            where: { id: cls.id },
            data: { currentSize: currentCount + studentIds.length },
          });

          // Gán lớp cho học sinh
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

      // ==========================================
      // BƯỚC 2: TẠO LỚP MỚI CHO HỌC SINH CÒN DƯ
      // ==========================================
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

        // Sinh mã lớp đảm bảo không bị trùng lặp trong DB
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

        // Tạo lớp mới
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

        // Gán lớp mới cho nhóm học sinh
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

  /**
   * Tìm kiếm và phân trang danh sách Học sinh (Chuẩn hóa theo đúng DTO)
   */
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

    // 1. Lấy đợt tuyển sinh tương ứng với batchId
    let campaign: { id: number } | null = null;

    if (batchId) {
      campaign = await this.prisma.admissionCampaign.findFirst({
        where: { batchId: Number(batchId) },
        select: { id: true }, // Chỉ lấy id, không select educationLevel nữa
      });
    }

    // 2. Lấy cấu hình giấy tờ bắt buộc theo campaignId (hoặc cấu hình mặc định)
    const docConfig = await this.prisma.documentConfig.findFirst({
      where: {
        OR: [
          ...(campaign ? [{ admissionCampaignId: campaign.id }] : []),
          { id: 1 }, // Fallback về cấu hình chung/mẫu
        ],
      },
      include: {
        items: {
          where: { required: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    const totalConfigItems = docConfig?.items || [];
    const totalRequiredDocs = totalConfigItems.length;

    // 2. Xây dựng điều kiện lọc (Where Clause) CHỈ DÙNG các trường trong DTO
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

    // 3. Thực thi truy vấn đồng thời (Count & FindMany)
    const [total, items] = await Promise.all([
      this.prisma.student.count({ where }),
      this.prisma.student.findMany({
        where,
        include: {
          user: true,
          batch: true,
          major: {
            select: {
              id: true,
              majorCode: true,
              majorName: true,
            },
          },
          class: {
            select: {
              id: true,
              classCode: true,
              className: true,
            },
          },
          admissionProfile: {
            include: {
              documents: {
                where: { status: DocumentStatus.APPROVED }, // Chỉ tính các giấy tờ đã duyệt
                select: {
                  documentConfigItemId: true,
                },
              },
            },
          },
        },
        skip,
        take: numericLimit,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // 4. Map dữ liệu để tính tiến độ hồ sơ & tiêu chí đạt (isQualified)
    const formattedItems = items.map((student) => {
      const profile = student.admissionProfile;

      // --- Tính tiến độ hồ sơ ---
      const approvedDocItemIds = new Set(profile?.documents.map((doc) => doc.documentConfigItemId) || []);

      const currentDocsCount = totalConfigItems.filter((configItem) => approvedDocItemIds.has(configItem.id)).length;

      // --- Tính tiêu chí đạt (isQualified) ---
      let isQualified = false;

      if (profile) {
        if (profile.isDirectAdmission) {
          isQualified = true;
        } else {
          const gpaList = [profile.gpa6, profile.gpa7, profile.gpa8, profile.gpa9].filter(
            (gpa): gpa is number => gpa !== null && gpa !== undefined,
          );

          const avgGpa = gpaList.length > 0 ? gpaList.reduce((sum, val) => sum + val, 0) / gpaList.length : 0;

          const validConducts: Conduct[] = [Conduct.KHA, Conduct.TOT];
          const isConductPassed =
            profile.conduct6 &&
            validConducts.includes(profile.conduct6) &&
            profile.conduct7 &&
            validConducts.includes(profile.conduct7) &&
            profile.conduct8 &&
            validConducts.includes(profile.conduct8) &&
            profile.conduct9 &&
            validConducts.includes(profile.conduct9);

          isQualified = (avgGpa >= 5.0 && Boolean(isConductPassed)) || (profile.scoreCalculated ?? 0) >= 5.0;
        }
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

    // 5. Transform sang Response DTO
    const students = formattedItems.map((item) =>
      plainToInstance(QualifiedStudentResponseDto, item, { excludeExtraneousValues: false }),
    );

    return {
      students,
      total,
    };
  }
}
