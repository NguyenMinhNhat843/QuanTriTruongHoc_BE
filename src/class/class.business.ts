import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StudentStatus } from "../../prisma/generated/prisma/client";
import {
  AssignStudentsToClassesDto,
  RequestEligibleStudents,
} from "./class.dto";
import { ClassService } from "./class.service";

@Injectable()
export class ClassBusinessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly classService: ClassService,
  ) {}

  /**
   * Phân lớp tự động cho sinh viên mới - Chia ĐỀU NHẤT CÓ THỂ giữa các lớp
   */
  async assignStudentsToClasses(body: AssignStudentsToClassesDto) {
    const { batchId, studentsPerClass = 40 } = body;

    // Kiểm tra khóa đào tạo [cite: 292]
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId }, // [cite: 294]
    });
    if (!batch) {
      throw new NotFoundException(
        `Không tìm thấy thông tin Khóa đào tạo với ID ${batchId}`,
      ); // [cite: 297, 298]
    }
    const majorId = batch.majorId; // [cite: 301]

    // 1. Lấy danh sách học sinh CHƯA CÓ LỚP (classId: null) [cite: 302]
    const newStudents = await this.prisma.student.findMany({
      where: {
        batchId, // [cite: 305]
        classId: null, // Only new students [cite: 306]
        status: StudentStatus.studying, // [cite: 307]
        batch: { curriculum: { majorId } }, // [cite: 308]
      },
      orderBy: { fullName: "asc" }, // [cite: 310]
    });

    if (newStudents.length === 0) {
      throw new BadRequestException("Không có sinh viên mới nào cần phân lớp."); // [cite: 313]
    }

    // Đảm bảo thông tin ngành tồn tại [cite: 315]
    await this.classService.validateMajorExist(majorId); // [cite: 316]

    // 2. Lấy danh sách các lớp ĐÃ TỒN TẠI của khóa này [cite: 317]
    const existingClasses = await this.prisma.class.findMany({
      where: {
        batchId, // [cite: 320]
        status: "ACTIVE", // [cite: 321]
      },
      orderBy: { classCode: "asc" }, // [cite: 323]
    });

    const letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"];

    return await this.prisma.$transaction(async (tx) => {
      // Cấu trúc quản lý danh sách lớp trong bộ nhớ tạm để rải đều dữ liệu
      const classRooms: Array<{
        id?: number;
        classCode: string;
        className: string;
        maxLimit: number;
        currentCount: number;
        initialCount: number;
        isNew: boolean;
        studentIds: number[];
      }> = [];

      // --- BƯỚC 3: ĐỌC THÔNG TIN VÀ TÍNH CHỖ TRỐNG CÁC LỚP CŨ ---
      let totalAvailableSlots = 0;

      for (const cls of existingClasses) {
        // Đếm trực tiếp số học sinh thực tế đang có trong lớp cũ từ DB
        const actualCurrentCount = await tx.student.count({
          where: { classId: cls.id },
        });

        // 🌟 ĐÃ XỬ LÝ: Nếu lớp có sẵn lấy field maxStudents, ngược lại lấy biến studentsPerClass
        const maxLimit = cls.maxStudents || studentsPerClass;
        const availableSlots = maxLimit - actualCurrentCount;

        if (availableSlots > 0) {
          totalAvailableSlots += availableSlots;
        }

        classRooms.push({
          id: cls.id,
          classCode: cls.classCode,
          className: cls.className,
          maxLimit,
          currentCount: actualCurrentCount,
          initialCount: actualCurrentCount,
          isNew: false,
          studentIds: [],
        });
      }

      // --- BƯỚC 4: TÍNH TOÁN VÀ KHỞI TẠO TRƯỚC CÁC LỚP MỚI NẾU THIẾU CHỖ ---
      let remainingStudentsCount = newStudents.length - totalAvailableSlots;

      // Tìm hậu tố chữ cái lớn nhất của lớp cũ để tăng tiến [cite: 375]
      let maxLetterIdx = -1;
      existingClasses.forEach((cls) => {
        const lastChar = cls.classCode.slice(-1).toUpperCase();
        const idx = letters.indexOf(lastChar);
        if (idx > maxLetterIdx) maxLetterIdx = idx;
      });
      let classCounter = maxLetterIdx + 1;

      // Nếu số học sinh mới nhiều hơn tổng chỗ trống hiện tại, tạo bộ khung lớp mới
      while (remainingStudentsCount > 0) {
        let classCode = "";
        let className = "";
        let isUnique = false;

        while (!isUnique) {
          const suffix = letters[classCounter] || `Lớp-${classCounter + 1}`;
          classCode = `${batch.batchCode}${suffix}`
            .toUpperCase()
            .replace(/\s+/g, ""); // [cite: 377, 379]
          className = `${batch.batchCode} ${suffix}`; // [cite: 380]

          // Check unique thực tế trong DB [cite: 382]
          const duplicateCheck = await tx.class.findUnique({
            where: { classCode },
          });

          // Check thêm cả trong mảng tạm thời vừa khởi tạo ở trên để tránh trùng trùng
          const duplicateInArray = classRooms.some(
            (c) => c.classCode === classCode,
          );

          if (!duplicateCheck && !duplicateInArray) {
            isUnique = true;
          } else {
            classCounter++;
          }
        }

        classRooms.push({
          classCode,
          className,
          maxLimit: studentsPerClass, // Lớp mới khởi tạo lấy biến studentsPerClass
          currentCount: 0,
          initialCount: 0,
          isNew: true,
          studentIds: [],
        });

        remainingStudentsCount -= studentsPerClass;
        classCounter++;
      }

      // --- BƯỚC 5: THUẬT TOÁN ROUND-ROBIN (RẢI ĐỀU SINH VIÊN VÀO CÁC LỚP CHƯA ĐẦY) ---
      let roomIndex = 0;

      for (const student of newStudents) {
        let loops = 0;
        // Tìm lớp tiếp theo vẫn còn chỗ trống để nhét vào
        while (
          classRooms[roomIndex].currentCount >=
            classRooms[roomIndex].maxLimit &&
          loops < classRooms.length
        ) {
          roomIndex = (roomIndex + 1) % classRooms.length; // Chuyển sang lớp tiếp theo theo vòng tròn
          loops++;
        }

        // Đẩy học sinh vào lớp được chọn
        classRooms[roomIndex].studentIds.push(student.id);
        classRooms[roomIndex].currentCount += 1;

        // Chuyển con trỏ lớp sang vị trí tiếp theo cho học sinh kế tiếp (Tạo hiệu ứng rải đều)
        roomIndex = (roomIndex + 1) % classRooms.length;
      }

      // --- BƯỚC 6: LƯU DỮ LIỆU THỰC TẾ VÀO DATABASE ---
      const resultDetails: any = [];

      for (const room of classRooms) {
        // Bỏ qua các lớp cũ đã đầy cứng và không được phân phối thêm sinh viên nào đợt này
        if (room.studentIds.length === 0) continue;

        let targetClassId = room.id;

        if (room.isNew) {
          // Thực hiện tạo lớp mới trong DB [cite: 382]
          const newClass = await this.classService.create(
            {
              classCode: room.classCode, // [cite: 384]
              className: room.className, // [cite: 385]
              majorId, // [cite: 386]
              batchId: batch.id, // [cite: 387]
              maxStudents: room.maxLimit, //
              currentSize: room.studentIds.length, // Sĩ số thực tế được rải đều [cite: 389]
              status: "active", // [cite: 390]
              formTeacherId: null, // [cite: 391]
            },
            tx, // [cite: 393]
          );
          targetClassId = newClass.id;
        } else {
          // Cập nhật lại chuẩn xác trường currentSize cho các lớp cũ [cite: 351]
          await tx.class.update({
            where: { id: room.id }, // [cite: 352]
            data: { currentSize: room.currentCount },
          });
        }

        // Cập nhật classId hàng loạt cho các học sinh thuộc lớp này [cite: 346, 396]
        await tx.student.updateMany({
          where: { id: { in: room.studentIds } }, // [cite: 347, 397]
          data: { classId: targetClassId }, // [cite: 348, 398]
        });

        resultDetails.push({
          classId: targetClassId,
          classCode: room.classCode,
          assignedCount: room.studentIds.length,
          note: room.isNew
            ? `Tạo lớp mới thành công (Sĩ số: ${room.currentCount}/${room.maxLimit})`
            : `Lấp đều vào lớp cũ thành công (Sĩ số mới: ${room.currentCount}/${room.maxLimit})`,
        });
      }

      return {
        message: `Phân lớp hoàn tất. Đã xử lý rải đều thêm ${newStudents.length} sinh viên mới vào các lớp.`, // [cite: 410]
        details: resultDetails, // [cite: 411]
      };
    });
  }

  /**
   * Lấy danh sách sinh viên đủ điều kiện phân lớp
   */
  async getEligibleStudentsForAssignment(query: RequestEligibleStudents) {
    const { batchId } = query;

    const students = await this.prisma.student.findMany({
      where: {
        status: StudentStatus.studying,
        classId: null,
        batchId: batchId || undefined,
      },
      include: {
        application: {
          include: { admission: true },
        },
      },
      orderBy: { fullName: "asc" },
    });

    return {
      totalEligible: students.length,
      students: students.map((s) => ({
        id: s.id,
        studentCode: s.studentCode,
        fullName: s.fullName,
        admissionName: s.application?.admission?.name || "Không rõ đợt",
      })),
    };
  }

  /**
   * Thêm học sinh vô 1 lớp
   */
  async addStudentToClass(classId: number, studentId: number) {
    return await this.prisma.$transaction(async (tx) => {
      const lopHoc = await tx.class.findUnique({
        where: { id: classId },
        select: {
          currentSize: true,
          maxStudents: true,
          className: true,
        },
      });

      if (!lopHoc) {
        throw new BadRequestException("Lớp học không tồn tại!");
      }

      if (lopHoc.currentSize >= lopHoc.maxStudents) {
        throw new BadRequestException(
          `Lớp ${lopHoc.className} đã đầy sĩ số (${lopHoc.currentSize}/${lopHoc.maxStudents}). 
          Không thể thêm học sinh!`,
        );
      }

      const updateStudent = await tx.student.update({
        where: { id: studentId },
        data: { classId },
      });

      await tx.class.update({
        where: { id: classId },
        data: {
          currentSize: {
            increment: 1,
          },
        },
      });

      return {
        message: `Thêm sinh viên ${updateStudent.fullName} vào lớp thành công!`,
        student: {
          id: updateStudent.id,
          fullName: updateStudent.fullName,
        },
      };
    });
  }
}
