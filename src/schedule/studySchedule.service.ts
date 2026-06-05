import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateStudyScheduleDto,
  SearchStudyScheduleDto,
} from "./studySchedule.dto";

@Injectable()
export class ScheduleService {
  constructor(private prisma: PrismaService) {}

  /**
   * Hàm tạo lịch học cho 1 lớp, 1 học kỳ
   */
  async generateScheduleForAClass(data: CreateStudyScheduleDto[]) {
    const formattedData = data.map((item) => ({
      ...item,
      studyDate: item.studyDate ? new Date(item.studyDate) : null,
    }));

    await this.prisma.classSubjectSchedule.createMany({
      data: formattedData,
      skipDuplicates: true,
    });

    return {
      message: "Tạo tiến độ đào tạo thành công",
    };
  }

  /**
   * Load study schedule của 1 lớp trong 1 kỳ
   */
  async loadStudySchedule(query: SearchStudyScheduleDto) {
    const { classId, semesterId, teacherId } = query;

    return this.prisma.classSubjectSchedule.findMany({
      where: {
        classSubject: {
          classId: classId ? Number(classId) : undefined,
          semesterId: semesterId ? Number(semesterId) : undefined,
          teacherId: teacherId ? Number(teacherId) : undefined,
        },
      },
      include: {
        classSubject: {
          select: {
            id: true,
            teacher: {
              select: {
                fullName: true,
                id: true,
              },
            },
            subject: {
              select: {
                subjectName: true,
                subjectCode: true,
                id: true,
              },
            },
            baseClass: {
              select: {
                id: true,
                className: true,
              },
            },
          },
        },
        room: {
          select: {
            id: true,
            roomCode: true,
          },
        },
      },
    });
  }
}
