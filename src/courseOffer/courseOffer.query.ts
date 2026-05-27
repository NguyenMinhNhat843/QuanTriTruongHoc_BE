import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CourseOfferQuery {
  constructor(private prisma: PrismaService) {}

  async queryDataForExportExcel(classSubjectId: number) {
    const courseOffer = await this.prisma.courseOffer.findUnique({
      where: { id: classSubjectId },
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
          },
        },
        baseClass: {
          select: {
            major: {
              select: {
                majorName: true,
              },
            },
            className: true,
            batch: {
              select: {
                batchCode: true,
              },
            },
          },
        },
        subject: {
          select: {
            subjectName: true,
            subjectCode: true,
          },
        },
        semester: {
          select: {
            term: true,
            year: true,
            name: true,
          },
        },
      },
    });

    if (!courseOffer) {
      throw new NotFoundException(
        `Không tìm thấy đợt mở môn với ID #${classSubjectId}`,
      );
    }

    // Gom dữ liệu vào object để map thông tin chung
    const keyValueData = {
      teacherName: courseOffer.teacher?.fullName || "",
      majorName: courseOffer.baseClass?.major?.majorName || "",
      semesterTerm: courseOffer.semester?.term || "",
      semesterYear: courseOffer.semester?.year || "",
      semesterName: courseOffer.semester?.name || "",
      batchCode: courseOffer.baseClass?.batch?.batchCode || "",
      subjectName: courseOffer.subject?.subjectName || "",
      subjectCode: courseOffer.subject?.subjectCode || "",
      className: courseOffer.baseClass?.className || "",
    };

    const gradeTable = await this.prisma.courseRegistration.findMany({
      where: {
        courseOfferId: classSubjectId,
      },
      include: {
        student: {
          select: {
            fullName: true,
            studentCode: true,
            dob: true,
          },
        },
      },
    });

    return {
      keyValueData,
      gradeTable,
    };
  }
}
