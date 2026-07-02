import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ClassService } from "./class.service";

@Injectable()
export class ClassBusinessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly classService: ClassService,
  ) {}

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

  /**
   * Đổi lớp cho sinh viên
   */
  async switchClassForStudent(studentId: number, newClassId: number) {
    await this.prisma.student.update({
      where: {
        id: studentId,
      },
      data: {
        classId: newClassId,
      },
    });
  }
}
