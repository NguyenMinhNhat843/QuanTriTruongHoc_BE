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
   * Phân lớp tự động cho sinh viên chính thức dựa trên Ngành, Khóa và sĩ số tối đa mỗi lớp
   */
  async assignStudentsToClasses(body: AssignStudentsToClassesDto) {
    const { batchId, studentsPerClass = 40 } = body;

    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
    });
    if (!batch) {
      throw new NotFoundException(
        `Không tìm thấy thông tin Khóa đào tạo với ID ${batchId}`,
      );
    }
    const majorId = batch.majorId;

    // 1. Lấy danh sách học sinh đủ điều kiện thuộc ngành, khóa đó
    const students = await this.prisma.student.findMany({
      where: {
        batchId,
        classId: null,
        status: StudentStatus.studying,
        batch: { curriculum: { majorId } },
      },
      orderBy: { fullName: "asc" },
    });

    if (students.length === 0) {
      throw new BadRequestException("Không có sinh viên nào cần phân lớp.");
    }

    // Đảm bảo thông tin ngành tồn tại trước khi chạy transaction
    await this.classService.validateMajorExist(majorId);

    // 2. Tính số lượng lớp cần tạo dựa trên sĩ số tối đa mỗi lớp
    const numClasses = Math.ceil(students.length / studentsPerClass);

    const getClassSuffix = (index: number) => {
      const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
      return letters[index] || `Lớp-${index + 1}`;
    };

    return await this.prisma.$transaction(async (tx) => {
      const createdClasses: any = [];

      for (let i = 0; i < numClasses; i++) {
        const suffix = getClassSuffix(i);
        const classCode = `${batch.batchCode}${suffix}`
          .toUpperCase()
          .replace(/\s+/g, "");
        const className = `${batch.batchCode} ${suffix}`;

        // Cắt mảng sinh viên tổng thành nhóm nhỏ cho lớp này
        const startIdx = i * studentsPerClass;
        const endIdx = startIdx + studentsPerClass;
        const studentsForThisClass = students.slice(startIdx, endIdx);
        const studentIdsForClass = studentsForThisClass.map((s) => s.id);

        const newClass = await this.classService.create(
          {
            classCode,
            className,
            majorId,
            batchId: batch.id,
            maxStudents: studentsPerClass,
            currentSize: studentsForThisClass.length,
            status: "active",
            formTeacherId: null,
          },
          tx,
        );

        // Cập nhật classId cho nhóm sinh viên thuộc lớp này theo lô (Bulk Update)
        await tx.student.updateMany({
          where: { id: { in: studentIdsForClass } },
          data: { classId: newClass.id },
        });

        createdClasses.push({
          classId: newClass.id,
          classCode: newClass.classCode,
          assignedCount: studentsForThisClass.length,
        });
      }

      return {
        message: `Phân lớp thành công cho ${students.length} sinh viên vào ${createdClasses.length} lớp.`,
        details: createdClasses,
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
}
