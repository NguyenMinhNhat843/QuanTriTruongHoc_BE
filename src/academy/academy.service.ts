import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SemesterService } from "../semester/semester.service";
import { BatchService } from "../batch/batch.service";
import { ClassSubjectService } from "../courseOffer/classSubject.service";
import { CreateSemesterDto } from "../semester/semester.dto";

@Injectable()
export class AcademyService {
  constructor(
    private prisma: PrismaService,
    private batchService: BatchService,
    private semesterService: SemesterService,
    private courseOfferService: ClassSubjectService,
  ) {}

  /**
   * Mở 1 học kỳ mới hoặc cập nhật classSubject cho học kỳ hiện tại
   */
  async openNewSemester(body: CreateSemesterDto) {
    let targetSemester: any;

    // 1. Kiểm tra xem học kỳ (year, term) này đã tồn tại trong DB chưa
    const existedSemester = await this.prisma.semester.findFirst({
      where: {
        year: body.year,
        term: body.term,
      },
    });

    if (existedSemester) {
      targetSemester = existedSemester;
    } else {
      targetSemester = await this.prisma.$transaction(async (tx) => {
        return await this.semesterService.create(body, tx);
      });
    }

    // 2. Lấy danh sách khóa học (batch) còn hiệu lực trong học kỳ này
    const batches =
      await this.batchService.findActiveBatchesBySemester(targetSemester);

    if (!batches.length) {
      return {
        message: `Xử lý xong học kỳ, không có khóa học nào đang hoạt động trong thời gian này.`,
      };
    }

    // 3. Tiến hành tạo classSubject (CourseOffer)
    for (const batch of batches) {
      const classes = await this.courseOfferService.getClassesByBatch(batch.id);
      const subjects = await this.batchService.getBatchSubjectsBySemester(
        batch.id,
        targetSemester,
      );

      if (!subjects.length) continue; // Nếu học kỳ này của khóa này không có môn nào thì bỏ qua

      for (const cls of classes) {
        // Chuẩn bị mảng dữ liệu chuẩn của CourseOffer
        const courseOffersData = subjects.map((sub) => ({
          courseName: `${sub?.subject?.subjectName} (Lớp ${cls.className})`,
          classId: cls.id,
          subjectId: sub.subjectId, // Hãy đảm bảo trường này đúng tên ở DB (sub.id hoặc sub.subjectId)
          semesterId: targetSemester.id,
        }));

        await this.prisma.courseOffer.createMany({
          data: courseOffersData,
          skipDuplicates: true,
        });
      }
    }

    return {
      message: existedSemester
        ? "Cập nhật các lớp học phần thành công"
        : "Mở học kỳ mới và cấu hình lớp học phần thành công",
    };
  }
}
