import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { BatchService } from "../batch/batch.service";

@Injectable()
export class ScheduleService {
  constructor(
    private prisma: PrismaService,
    private batchService: BatchService,
  ) {}

  /**
   * Phân thời khóa biểu cho 1 môn của 1 lớp
   */
  async genScheduleForAClassSUbject(
    classSubjectId: number,
    semesterId: number,
  ) {
    const semester = await this.prisma.semester.findUnique({
      where: {
        id: semesterId,
      },
    });

    // Lấy môn học của classSubject
    const classSubject = await this.prisma.courseOffer.findUnique({
      where: {
        id: classSubjectId,
        semesterId,
      },
      include: {
        subject: true,
      },
    });

    // Lấy tổng số giờ lý thuyết, thực hành, kiểm tra của môn này
    const { testHours, practiceHours, theoryHours } =
      classSubject?.subject || {};
    const totalHourseStudy =
      (testHours || 0) + (practiceHours || 0) + (theoryHours || 0);
    // Quy chuẩn 1 tiết học là 45p, suy ra số tiết cần có trong 1 kỳ
    const timePerTietHoc = 45; // phút
    const totalTietHoc = totalHourseStudy / timePerTietHoc;
    const teachWeeks = semester?.teachingWeeks || 1;

    // Phân bổ 1 tuần cần mấy buổi, mỗi buổi mấy tiết
    const soTietMoiTuan = Math.ceil(totalTietHoc / teachWeeks); // Ví dụ: 60 tiết / 10 tuần = 1 tuần 6 tiết
    const soTietToiDaMoiNgay = 3;
    const data = [];
  }

  /**
   * Hàm phân lịch tự động
   */
  async genScheduleForDepartment(departmentId: number, semesterId: number) {
    const classSubjects = await this.prisma.courseOffer.findMany({
      where: {
        semesterId,
      },
    });
  }
}
