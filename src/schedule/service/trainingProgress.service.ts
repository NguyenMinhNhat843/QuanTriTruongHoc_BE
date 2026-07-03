import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { resolveCurriculumSemesterNumber } from "../../utils/academic.util";
import {
  ResponseTrainingProgress,
  UpsertTrainingPlanDto,
} from "../dto/training-progress.dto";
import { plainToInstance } from "class-transformer";

@Injectable()
export class TrainingPlanService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 1. HÀM LẤY KẾ HOẠCH ĐÀO TẠO (Lấy Subject trong CTK làm gốc)
   */
  async getTrainingPlan(classId: number, semesterId: number) {
    // 1. Xác định học kỳ khung hiện tại của lớp là kỳ mấy (Ví dụ: kỳ 1, kỳ 2, kỳ 3...)
    const semesterNumber = await resolveCurriculumSemesterNumber(
      this.prisma,
      classId,
      semesterId,
    );

    // 2. Tìm Chương trình khung gắn với lớp này thông qua Batch
    const classInfo = await this.prisma.class.findUnique({
      where: { id: classId },
      include: {
        batch: {
          select: { curriculumId: true },
        },
      },
    });

    if (!classInfo?.batch?.curriculumId) {
      throw new BadRequestException(
        "Lớp học hoặc Khóa học chưa được cấu hình Chương trình khung.",
      );
    }

    // 3. Lấy tất cả môn học thuộc kỳ khung này trong Chương trình khung
    const curriculumSubjects = await this.prisma.curriculumSubject.findMany({
      where: {
        curriculumId: classInfo.batch.curriculumId,
        semesterNumber: semesterNumber,
      },
      include: {
        subject: true,
      },
    });

    // 4. Lấy tất cả các kế hoạch (ClassSubject) thực tế ĐÃ TẠO của lớp trong học kỳ này
    const existingClasSubject = await this.prisma.courseOffer.findMany({
      where: {
        classId: classId,
        semesterId: semesterId,
      },
      include: {
        teacher: true, // Thông tin giáo viên
        classSubjectSessions: {
          include: {
            schedules: { orderBy: { weekNumber: "asc" } },
          },
        },

        subject: true,
      },
    });
    let subjects = existingClasSubject.map(
      (classSubject) => classSubject.subject,
    );
    if (!subjects || subjects.length === 0) {
      subjects = curriculumSubjects.map((cs) => cs.subject);
    }

    // 5. Trộn dữ liệu (Map): Môn nào chưa có CourseOffer thì trả về null/rỗng
    const trainingPlan = subjects.map((subject) => {
      // Tìm xem môn này đã được kích hoạt lập lịch chưa
      const classSubject = existingClasSubject.find(
        (cs) => cs.subjectId === subject.id,
      );

      return {
        classSubject: classSubject || null,
        subject: subject,
        teacher: classSubject?.teacher || null,
        classSubjectSessions: classSubject?.classSubjectSessions || [],
      };
    });

    return plainToInstance(ResponseTrainingProgress, trainingPlan);
  }

  /**
   * 2. HÀM UPSERT KẾ HOẠCH ĐÀO TẠO (Tạo/Cập nhật CourseOffer trước rồi tạo lịch)
   */
  async upsertTrainingPlan(dto: UpsertTrainingPlanDto) {
    const { classId, semesterId, subjectId, teacherId, sessions } = dto;

    return this.prisma.$transaction(async (tx) => {
      // Bước 1: Tìm xem đã có bản ghi CourseOffer (classSubject) cho bộ ba này chưa
      let courseOffer = await tx.courseOffer.findFirst({
        where: { classId, semesterId, subjectId },
      });

      if (!courseOffer) {
        // Nếu chưa có -> Tiến hành tạo mới hoàn toàn
        courseOffer = await tx.courseOffer.create({
          data: {
            classId,
            semesterId,
            subjectId,
            teacherId: teacherId || null,
          },
        });
      } else {
        // Nếu đã có -> Cập nhật lại giáo viên dạy nếu có sự thay đổi
        courseOffer = await tx.courseOffer.update({
          where: { id: courseOffer.id },
          data: { teacherId: teacherId || null },
        });
      }

      const finalSessions: any = [];

      // Bước 2: Duyệt qua từng buổi học (Session) gửi lên từ client
      for (const sessionDto of sessions) {
        const countPeriod = sessionDto.endPeriod - sessionDto.startPeriod + 1;
        let sessionResult;

        if (sessionDto.id) {
          // Nếu có ID -> Cập nhật Session cũ
          sessionResult = await tx.classSubjectSession.update({
            where: { id: sessionDto.id },
            data: {
              dayOfWeek: sessionDto.dayOfWeek,
              shift: sessionDto.shift,
              startPeriod: sessionDto.startPeriod,
              endPeriod: sessionDto.endPeriod,
              countPeriod: countPeriod,
              roomId: sessionDto.roomId || null,
            },
          });
        } else {
          // Nếu không có ID -> Tạo mới Session nối thẳng vào `courseOffer.id` vừa xử lý phía trên
          sessionResult = await tx.classSubjectSession.create({
            data: {
              classSubjectId: courseOffer.id,
              dayOfWeek: sessionDto.dayOfWeek,
              shift: sessionDto.shift,
              startPeriod: sessionDto.startPeriod,
              endPeriod: sessionDto.endPeriod,
              countPeriod: countPeriod,
              roomId: sessionDto.roomId || null,
            },
          });
        }

        const finalDetails: any = [];

        // Bước 3: Duyệt tiếp các chi tiết ngày học theo tuần (Schedule Detail)
        for (const scheduleDto of sessionDto.schedules!) {
          if (scheduleDto.id) {
            // Đã có bản ghi ngày cụ thể -> Cập nhật
            const detail = await tx.classSubjectScheduleDetail.update({
              where: { id: scheduleDto.id },
              data: {
                weekNumber: scheduleDto.weekNumber,
                studyDate: scheduleDto.studyDate
                  ? new Date(scheduleDto.studyDate)
                  : null,
                roomId: scheduleDto.roomId || null,
              },
            });
            finalDetails.push(detail);
          } else {
            // Chưa có bản ghi ngày cụ thể -> Tạo mới dựa trên ID của session vừa sinh ra
            const detail = await tx.classSubjectScheduleDetail.create({
              data: {
                sessionId: sessionResult.id,
                weekNumber: scheduleDto.weekNumber,
                studyDate: scheduleDto.studyDate
                  ? new Date(scheduleDto.studyDate)
                  : null,
                roomId: scheduleDto.roomId || null,
              },
            });
            finalDetails.push(detail);
          }
        }

        finalSessions.push({
          ...sessionResult,
          schedules: finalDetails,
        });
      }

      return {
        message: "Lưu kế hoạch đào tạo thành công",
        classSubjectId: courseOffer.id,
        sessions: finalSessions,
      };
    });
  }
}
