import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CourseOfferQuery {
  constructor(private prisma: PrismaService) {}

  async queryDataForExportExcel(courseOfferId: number) {
    const courseOffer = await this.prisma.courseOffer.findUnique({
      where: { id: courseOfferId },
      include: {
        teacher: true,
        registrations: {
          select: {
            student: {
              select: {
                fullName: true,
                studentCode: true,
                dob: true,
              },
            },
            gradeEntries: {
              select: {
                score: true,
                component: {
                  select: {
                    name: true,
                    weight: true,
                  },
                },
              },
            },
          },
        },
        baseClass: {
          select: {
            major: {
              select: {
                majorName: true,
              },
            },
            batch: {
              select: {
                batchCode: true,
              },
            },
          },
        },
        semester: {
          select: {
            term: true,
            year: true,
          },
        },
      },
    });

    if (!courseOffer) {
      throw new NotFoundException(
        `Không tìm thấy đợt mở môn với ID #${courseOfferId}`,
      );
    }

    // Gom dữ liệu vào object để map thông tin chung
    const keyValueData = {
      courseOfferName: courseOffer.courseName || "",
      teacherName: courseOffer.teacher?.fullName || "",
      majorName: courseOffer.baseClass?.major?.majorName || "",
      semesterTerm: courseOffer.semester?.term || "",
      semesterYear: courseOffer.semester?.year || "",
      batchCode: courseOffer.baseClass?.batch?.batchCode || "",
    };

    // Lấy danh sách thành phần điểm  79]
    const gradeComponents = await this.prisma.gradeComponent.findMany({
      where: {
        subjectGrades: {
          some: {
            subject: {
              courseOffers: {
                some: { id: courseOfferId },
              },
            },
          },
        },
      },
      orderBy: { id: "asc" },
    });

    const gradeComponentsData = gradeComponents.map((comp) => ({
      componentName: comp.name + ` (${comp.weight}%)`,
    }));

    // Parse danh sách sinh viên và điểm số
    const students = courseOffer.registrations.map((reg) => ({
      ...reg.student,
      grades: reg.gradeEntries.map((entry) => ({
        score: entry.score,
        column: entry.component.name + ` (${entry.component.weight}%)`,
      })),
    }));

    return {
      keyValueData,
      gradeComponentsData,
      students,
    };
  }
}
