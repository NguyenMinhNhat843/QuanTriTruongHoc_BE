import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateBulkCourseOfferDto } from "./classSubject.dto";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CourseOfferGenerateService {
  constructor(private prisma: PrismaService) {}

  /**
   * TÍnh năng tạo hàng loạt classSubject trong 1 học kỳ
   */
  async generateClassSubjectBySemester(semesterId: number) {
    const semester = await this.prisma.semester.findUnique({
      where: { id: semesterId },
    });

    if (!semester || !semester.year || !semester.term) {
      throw new NotFoundException("Học kỳ không hợp lệ");
    }

    const { year, term } = semester;

    const batches = await this.prisma.batch.findMany({
      include: {
        classes: true,
        curriculum: {
          include: {
            curriculumSubjects: true,
          },
        },
      },
    });

    const classSubjectsToCreate: any[] = [];

    for (const batch of batches) {
      const subjects = batch.curriculum?.curriculumSubjects || [];
      if (subjects.length === 0) continue;

      const maxSemesterNum = Math.max(...subjects.map((s) => s.semesterNumber));
      const startTerm = 1;
      const startYear = batch.startYear;

      const semesterCurrentInCurriculum = (year - startYear) * 2 + term;

      if (
        semesterCurrentInCurriculum >= startTerm &&
        semesterCurrentInCurriculum <= maxSemesterNum
      ) {
        const subjectsInCurriculum = subjects.filter(
          (s) => s.semesterNumber === semesterCurrentInCurriculum,
        );

        const classes = batch.classes;

        for (const subject of subjectsInCurriculum) {
          for (const cls of classes) {
            classSubjectsToCreate.push({
              subjectId: subject.subjectId,
              semesterId: semesterId,
              classId: cls.id,
            });
          }
        }
      }
    }

    let totalCreated = 0;
    if (classSubjectsToCreate.length > 0) {
      const result = await this.prisma.courseOffer.createMany({
        data: classSubjectsToCreate,
        skipDuplicates: true,
      });
      totalCreated = result.count;
    }

    return {
      message: `Đã khởi tạo lớp học phần cho học kỳ ${semester.name}`,
      totalBatches: batches.length,
      totalCourseOffersCreated: totalCreated,
    };
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
}
