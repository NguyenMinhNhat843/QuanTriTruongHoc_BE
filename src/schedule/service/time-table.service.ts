import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class TimeTableService {
  constructor(private readonly prisma: PrismaService) {}
  /**
   * Lấy thời khóa biểu ngày hôm nay của sinh viên
   */
  async getTodaySchedule(studentId: number) {
    // 1. Kiểm tra sinh viên và lấy classId (Lớp hành chính)
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { classId: true },
    });

    if (!student || !student.classId) {
      throw new NotFoundException(
        "Sinh viên chưa được xếp lớp hành chính hoặc không tồn tại",
      );
    }

    // 2. Định dạng thời gian ngày hôm nay (chỉ giữ lại YYYY-MM-DD để so khớp DB Date)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 3. Tìm các lịch học chi tiết diễn ra vào ngày hôm nay
    const schedules = await this.prisma.classSubjectScheduleDetail.findMany({
      where: {
        studyDate: today,
        session: {
          classSubject: {
            classId: student.classId, // Lọc theo lớp hành chính của sinh viên
            semester: {
              isCurrent: true, // Chỉ lấy ở học kỳ hiện tại
            },
          },
        },
      },
      include: {
        session: {
          include: {
            classSubject: {
              include: {
                subject: {
                  select: {
                    subjectCode: true,
                    subjectName: true,
                    credits: true,
                  },
                },
                teacher: {
                  select: {
                    fullName: true,
                    email: true,
                  },
                },
              },
            },
            room: {
              select: {
                roomCode: true,
                building: true,
              },
            }, // Phòng học cố định/mặc định
          },
        },
        room: {
          select: {
            roomCode: true,
            building: true,
          },
        }, // Phòng học đổi (nếu có override)
      },
      orderBy: {
        session: {
          startPeriod: "asc", // Xếp theo thứ tự tiết học tăng dần từ sáng đến tối
        },
      },
    });

    // 4. Map lại data gọn đẹp, xử lý fallback phòng học cho Frontend dễ hiển thị
    return schedules.map((item) => {
      const session = item.session;
      const courseOffer = session.classSubject;

      // Nếu có phòng ghi đè ở bảng Detail thì dùng, không thì lấy phòng mặc định ở Session
      const activeRoom = item.room || session.room;

      return {
        scheduleId: item.id,
        weekNumber: item.weekNumber,
        studyDate: item.studyDate,
        subjectCode: courseOffer.subject.subjectCode,
        subjectName: courseOffer.subject.subjectName,
        credits: courseOffer.subject.credits,
        teacherName: courseOffer.teacher?.fullName || "Chưa phân công",
        shift: session.shift, // S - C - T
        startPeriod: session.startPeriod,
        endPeriod: session.endPeriod,
        countPeriod: session.countPeriod,
        roomCode: activeRoom?.roomCode || "Trực tuyến/Chưa xếp phòng",
        building: activeRoom?.building || null,
        isRoomOverridden: !!item.roomId, // Báo cho FE biết hôm nay có đổi phòng học không
      };
    });
  }
}
