import { BadRequestException, Injectable } from "@nestjs/common";
import { resolveCurriculumSemesterNumber } from "../utils/academic.util";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTrainingProgressDto } from "./dto/training-progreee.dto";

@Injectable()
export class TrainingProgressService {
  constructor(private readonly prisma: PrismaService) {}
  /**
   * Lấy dữ liệu bảng kế hoạch giảng dạy của 1 học kỳ, 1 lớp (Môn học làm chủ)
   */
  async getStudySchedule(classId: number, semesterId: number) {
    // 1. Tính toán số học kỳ khung bằng hàm util
    const semesterNumber = await resolveCurriculumSemesterNumber(
      this.prisma,
      classId,
      semesterId,
    );

    // 2. Tìm thông tin lớp học để lấy curriculumId
    const classInfo = await this.prisma.class.findUnique({
      where: { id: classId },
      include: { batch: true },
    });

    if (!classInfo || !classInfo.batch || !classInfo.batch.curriculumId) {
      throw new BadRequestException(
        "Lớp học chưa được gán Khóa đào tạo hoặc Chương trình khung hợp lệ.",
      );
    }

    const curriculumId = classInfo.batch.curriculumId;

    // 3. Lấy TẤT CẢ các môn học được thiết kế trong học kỳ khung này (Bao gồm thông tin Subject chi tiết)
    const curriculumSubjects = await this.prisma.curriculumSubject.findMany({
      where: {
        curriculumId: curriculumId,
        semesterNumber: semesterNumber,
      },
      include: {
        subject: true, // Chắc chắn có dữ liệu chi tiết môn học
      },
    });

    // Nếu học kỳ khung này không có môn nào thì trả về mảng rỗng
    if (curriculumSubjects.length === 0) {
      return [];
    }

    const subjectIdsInSemester = curriculumSubjects.map((cs) => cs.subjectId);

    // 4. Tìm các CourseOffer đã được tạo cho lớp và học kỳ này (nếu có)
    const courseOffers = await this.prisma.courseOffer.findMany({
      where: {
        classId: classId,
        semesterId: semesterId,
        subjectId: {
          in: subjectIdsInSemester,
        },
      },
      include: {
        classSubjectSchedule: true, // Lấy lịch học đi kèm
      },
    });

    // Biến đổi mảng courseOffers thành Map để tìm kiếm nhanh theo subjectId với độ phức tạp O(1)
    const offerMap = new Map<number, (typeof courseOffers)[0]>();
    courseOffers.forEach((offer) => {
      offerMap.set(offer.subjectId, offer);
    });

    // 5. Map dữ liệu trả về lấy CurriculumSubject làm gốc
    return curriculumSubjects.map((cs) => {
      // Tìm xem môn này đã được tạo lớp học phần (CourseOffer) chưa
      const matchedOffer = offerMap.get(cs.subjectId);

      if (matchedOffer) {
        // Nếu ĐÃ CÓ classSubject (CourseOffer)
        const { classSubjectSchedule, ...classSubjectInfo } = matchedOffer;

        return {
          classSubject: classSubjectInfo, // Có thông tin lớp học phần
          subject: cs.subject, // Có thông tin môn học
          schedules:
            classSubjectSchedule.length > 0 ? classSubjectSchedule : null, // Trả về null nếu mảng lịch rỗng
        };
      } else {
        // Nếu CHƯA CÓ classSubject (Chưa được gán giáo viên/mở lớp học phần cho kỳ này)
        return {
          classSubject: null,
          subject: cs.subject, // Vẫn chắc chắn có thông tin môn học ở đây
          schedules: [],
        };
      }
    });
  }

  async createTrainingProgress(body: CreateTrainingProgressDto) {
    const { schedulesItems, classSubjects } = body;

    // 1. Tạo các classSubject (nếu chưa có)
    await this.prisma.courseOffer.createMany({
      data: classSubjects.map((cs) => ({
        classId: cs.classId,
        subjectId: cs.subjectId,
        semesterId: cs.semesterId,
        teacherId: cs.teacherId || null,
      })),
      skipDuplicates: true, // Bỏ qua nếu đã tồn tại
    });
    // 2. Tạo các lịch học (schedules)
    await this.prisma.classSubjectSchedule.createMany({
      data: schedulesItems,
      skipDuplicates: true,
    });

    return {
      message: "Tạo tiến độ đào tạo thành công",
    };
  }
}
