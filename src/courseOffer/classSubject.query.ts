import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CourseOfferQuery {
  constructor(private prisma: PrismaService) {}

  // 1. Hàm bổ trợ để lấy từ cuối cùng (Tên) trong chuỗi Họ và Tên
  private getLastName = (fullName: string) => {
    if (!fullName) return "";
    const parts = fullName.trim().split(/\s+/);
    return parts[parts.length - 1]; // Lấy phần tử cuối cùng
  };

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
            credits: true,
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
      credits: courseOffer.subject?.credits || 0,
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

    gradeTable.sort((a, b) => {
      const nameA = this.getLastName(a.student?.fullName || "");
      const nameB = this.getLastName(b.student?.fullName || "");

      // So sánh Tên cuối trước (sử dụng locale 'vi' để xếp đúng chuẩn tiếng Việt)
      const compareLastName = nameA.localeCompare(nameB, "vi", {
        sensitivity: "base",
      });

      // Nếu Tên cuối giống nhau (ví dụ: cùng tên "Anh"), so sánh tiếp toàn bộ fullName (để xét đến Họ và Tên đệm)
      if (compareLastName !== 0) {
        return compareLastName;
      }

      return (a.student?.fullName || "").localeCompare(
        b.student?.fullName || "",
        "vi",
      );
    });

    return {
      keyValueData,
      gradeTable,
    };
  }
}
