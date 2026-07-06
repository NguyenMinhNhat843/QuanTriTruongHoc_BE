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
    const semesterNumber = await resolveCurriculumSemesterNumber({
      prisma: this.prisma,
      classId: classId,
      semesterId: semesterId,
    });

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
    const { classId, semesterId, items } = dto;

    return await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        const { sessions, subjectId, teacherId } = item;

        // Tìm xem đã có môn học này trong lớp/học kỳ này chưa
        const classSubject = await tx.courseOffer.findFirst({
          where: {
            classId,
            semesterId,
            subjectId,
          },
        });

        let currentClassSubjectId: number;

        if (!classSubject) {
          // TRƯỜNG HỢP 1: TẠO MỚI CourseOffer
          const newClassSubject = await tx.courseOffer.create({
            data: {
              classId,
              semesterId,
              subjectId,
              teacherId: teacherId || null,
            },
          });
          currentClassSubjectId = newClassSubject.id;
        } else {
          // TRƯỜNG HỢP 2: CẬP NHẬT ClassSubject
          await tx.courseOffer.update({
            where: { id: classSubject.id },
            data: {
              teacherId: teacherId || null,
            },
          });
          currentClassSubjectId = classSubject.id;

          // --- XỬ LÝ XÓA DỮ LIỆU CŨ ĐỂ LÀM SẠCH ---
          // Bước 2: Xóa các Sessions (Buổi học) cũ, tự động xóa các chedules bên trong
          await tx.classSubjectSession.deleteMany({
            where: {
              classSubjectId: classSubject.id,
            },
          });
        }

        // =================================================================
        // TIẾN HÀNH TẠO MỚI SESSIONS & SCHEDULES (Dùng chung cho cả Tạo mới và Cập nhật)
        // =================================================================
        for (const session of sessions) {
          const { schedules, ...sessionData } = session;

          // 1. Tạo mới buổi học (Session) và gán mối quan hệ với CourseOffer
          const newSession = await tx.classSubjectSession.create({
            data: {
              ...sessionData,
              classSubjectId: currentClassSubjectId, // Liên kết buổi học với môn học hiện tại
            },
          });

          // 2. Tạo hàng loạt chi tiết lịch học (Schedules) cho buổi học vừa tạo
          if (schedules && schedules.length > 0) {
            await tx.classSubjectScheduleDetail.createMany({
              data: schedules.map((schedule) => ({
                sessionId: newSession.id, // Dùng ID thực tế vừa được sinh ra trong DB
                weekNumber: schedule.weekNumber,
                studyDate: schedule.studyDate
                  ? new Date(schedule.studyDate)
                  : null,
                roomId: schedule.roomId || null,
              })),
            });
          }
        }
      }
    });
  }
}
