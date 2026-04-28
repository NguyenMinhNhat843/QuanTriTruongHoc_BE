import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AcademicUtils } from "../utils/academic.util";
import { StudentQuery } from "../student/student.query";
import { SemesterQuery } from "../semester/semester.query";
import { CurriculumSubjectQuery } from "../curriculumSubject/curriculumSubject.query";

@Injectable()
export class CourseRegisService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studentQuery: StudentQuery,
    private readonly semesterQuery: SemesterQuery,
    private readonly curriculumSubjectQuery: CurriculumSubjectQuery,
  ) {}
  // ======================
  // TỰ ĐỘNG ĐĂNG KÝ LỚP ỌC PHẦN THEO CHƯƠNG TRÌNH CHO HỌC SINH
  // ======================
  async autoRegisterByCurriculum(studentId: number) {
    // 1. Lấy student + curriculum
    const student =
      await this.studentQuery.getStudentWithBatchAndCurriculum(studentId);

    // Truy vấn học kỳ hiện tại
    const currentSemester = await this.semesterQuery.getCurrentSemester();

    // 2. Tính semesterIndex
    const semesterIndex = AcademicUtils.calculateSemesterIndex(
      student.enrollmentDate!,
      currentSemester.startDate,
    );

    // 3. Lấy môn trong curriculum của học kỳ này
    const requiredSubjects =
      await this.curriculumSubjectQuery.getSubjectsByCurriculumAndSemester(
        student.batch!.curriculumId!,
        semesterIndex,
      );
    const subjectIds = requiredSubjects.map((s) => s.subjectId);
    if (subjectIds.length === 0) {
      return { message: "Không có môn nào cần đăng ký" };
    }

    return await this.prisma.$transaction(async (tx) => {
      // 4. Lấy các lớp open
      const availableClasses = await tx.courseOffer.findMany({
        where: {
          semesterId: currentSemester.id,
          subjectId: { in: subjectIds },
          status: "open",
        },
      });

      // 5. Lấy schedule hiện tại của sinh viên
      const existingSchedules = await tx.courseSchedule.findMany({
        where: {
          courseOffer: {
            registrations: {
              some: { studentId },
            },
          },
        },
      });

      // group course theo subject
      const coursesBySubject = new Map<number, any[]>();

      for (const course of availableClasses) {
        if (!coursesBySubject.has(course.subjectId)) {
          coursesBySubject.set(course.subjectId, []);
        }
        coursesBySubject.get(course.subjectId)!.push(course);
      }

      const registeredCourses: any = [];

      // 6. xử lý từng môn
      for (const subjectId of subjectIds) {
        // 6.1 check đã đăng ký môn chưa
        const alreadyRegistered = await tx.courseRegistration.findFirst({
          where: {
            studentId,
            courseOffer: {
              subjectId,
            },
          },
        });

        if (alreadyRegistered) continue;

        const courses = coursesBySubject.get(subjectId) || [];

        if (courses.length === 0) {
          throw new Error(`Không có lớp mở cho môn ${subjectId}`);
        }

        // sort: ưu tiên lớp ít người
        courses.sort((a, b) => a.currentStudents - b.currentStudents);

        let selectedCourse: any = null;

        // 6.2 chọn lớp phù hợp
        for (const course of courses) {
          // check sĩ số
          if (course.currentStudents >= course.maxStudents) continue;

          // lấy schedule của lớp này
          const schedules = await tx.courseSchedule.findMany({
            where: { courseOfferId: course.id },
          });

          // check conflict
          const conflict = schedules.some((s) =>
            existingSchedules.some((es) => AcademicUtils.isConflict(s, es)),
          );

          if (conflict) continue;

          selectedCourse = course;
          break;
        }

        if (!selectedCourse) {
          throw new Error(
            `Không thể xếp lịch cho môn ${subjectId} (trùng lịch hoặc full lớp)`,
          );
        }

        // 6.3 đăng ký
        await tx.courseRegistration.create({
          data: {
            studentId,
            courseOfferId: selectedCourse.id,
            registeredAt: new Date(),
            status: "confirmed",
          },
        });

        // 6.4 update sĩ số
        await tx.courseOffer.update({
          where: { id: selectedCourse.id },
          data: {
            currentStudents: {
              increment: 1,
            },
          },
        });

        // 6.5 thêm schedule vào existing để check tiếp
        const newSchedules = await tx.courseSchedule.findMany({
          where: { courseOfferId: selectedCourse.id },
        });

        existingSchedules.push(...newSchedules);

        registeredCourses.push(selectedCourse.id);
      }

      return {
        message: "Tự động đăng ký hoàn tất",
        registeredCourses,
      };
    });
  }
}
