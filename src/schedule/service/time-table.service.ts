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

  /**
   * Lấy thời khóa biểu theo tuần của một Lớp trong một Học kỳ
   * Hỗ trợ tự động phân tích classId từ studentId hoặc teacherId nếu không truyền classId trực tiếp
   */
  async getWeeklySchedule(query: {
    weekNumber: number;
    semesterId?: number;
    classId?: number;
    studentId?: number;
    teacherId?: number;
  }) {
    const { weekNumber, semesterId, studentId, teacherId } = query;
    let targetClassId = query.classId ? Number(query.classId) : undefined;
    let targetSemesterId = semesterId ? Number(semesterId) : undefined;

    // 1. XỬ LÝ FALLBACK ĐỂ TÌM HỌC KỲ HIỆN TẠI (Nếu không truyền semesterId)
    if (!targetSemesterId) {
      const currentSemester = await this.prisma.semester.findFirst({
        where: { isCurrent: true },
        select: { id: true },
      });
      targetSemesterId = currentSemester?.id;
    }

    if (!targetSemesterId) {
      throw new NotFoundException(
        "Không tìm thấy học kỳ hiện tại hoặc học kỳ được yêu cầu.",
      );
    }

    // 2. XỬ LÝ FALLBACK ĐỂ TÌM CLASS_ID DỰA TRÊN STUDENT_ID HOẶC TEACHER_ID
    if (!targetClassId) {
      if (studentId) {
        // Nếu truyền studentId, tìm lớp hành chính của học sinh đó
        const student = await this.prisma.student.findUnique({
          where: { id: Number(studentId) },
          select: { classId: true },
        });
        if (!student || !student.classId) {
          throw new NotFoundException(
            "Học sinh chưa được xếp lớp hành chính hoặc không tồn tại.",
          );
        }
        targetClassId = student.classId;
      } else if (teacherId) {
        /**
         * LƯU Ý: Với Giáo viên (Teacher), một tuần họ có thể dạy nhiều lớp khác nhau.
         * Nếu truyền teacherId mà KHÔNG truyền classId, logic dưới đây sẽ lấy LỊCH DẠY CỦA GIÁO VIÊN ĐÓ
         * trên TẤT CẢ CÁC LỚP trong tuần được yêu cầu thay vì bó buộc vào 1 lớp.
         */
      } else {
        throw new NotFoundException(
          "Vui lòng cung cấp classId, studentId hoặc teacherId để truy vấn lịch học.",
        );
      }
    }

    // 3. TRUY VẤN DỮ LIỆU TỪ DATABASE
    const schedules = await this.prisma.classSubjectScheduleDetail.findMany({
      where: {
        weekNumber: Number(weekNumber),
        session: {
          classSubject: {
            semesterId: targetSemesterId,
            classId: targetClassId ? targetClassId : undefined, // Lọc theo lớp (nếu xác định được)
            teacherId: teacherId ? Number(teacherId) : undefined, // Lọc theo giáo viên (nếu có truyền)
          },
        },
      },
      include: {
        room: {
          select: {
            id: true,
            roomCode: true,
            building: true,
          },
        },
        session: {
          include: {
            room: {
              select: {
                id: true,
                roomCode: true,
                building: true,
              },
            },
            classSubject: {
              select: {
                id: true,
                teacher: {
                  select: {
                    id: true,
                    fullName: true,
                  },
                },
                subject: {
                  select: {
                    id: true,
                    subjectCode: true,
                    subjectName: true,
                    credits: true,
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
          },
        },
      },
      orderBy: [
        { session: { dayOfWeek: "asc" } }, // Thứ 2 -> Chủ Nhật
        { session: { shift: "asc" } }, // Sáng -> Chiều -> Tối
        { session: { startPeriod: "asc" } }, // Tiết 1 -> Tiết muộn hơn
      ],
    });

    // 4. MAP VÀ LÀM PHẲNG (FLATTEN) DỮ LIỆU ĐẦU RA ĐỂ TRẢ VỀ CHO FRONTEND
    return schedules.map((item) => {
      const session = item.session;
      const courseOffer = session.classSubject;

      // Logic phòng học: Nếu có phòng đổi đột xuất (bảng detail) thì lấy, không thì dùng phòng mặc định (bảng session)
      const activeRoom = item.room || session.room;

      return {
        scheduleId: item.id,
        weekNumber: item.weekNumber,
        studyDate: item.studyDate,
        dayOfWeek: session.dayOfWeek, // MONDAY, TUESDAY... giúp FE xếp cột trên Grid lịch tuần

        // Thông tin môn học
        subjectId: courseOffer.subject.id,
        subjectCode: courseOffer.subject.subjectCode,
        subjectName: courseOffer.subject.subjectName,
        credits: courseOffer.subject.credits,

        // Thông tin lớp học phần thực tế của buổi này
        classId: courseOffer.baseClass?.id || null,
        className: courseOffer.baseClass?.className || "Lớp tự do",

        // Thông tin giáo viên đứng lớp
        teacherId: courseOffer.teacher?.id || null,
        teacherName: courseOffer.teacher?.fullName || "Chưa phân công",

        // Thông tin thời gian học
        shift: session.shift, // S - C - T
        startPeriod: session.startPeriod,
        endPeriod: session.endPeriod,
        countPeriod:
          session.countPeriod || session.endPeriod - session.startPeriod + 1,

        // Thông tin phòng học sau khi xử lý đổi phòng đột xuất (nếu có)
        roomId: activeRoom?.id || null,
        roomCode: activeRoom?.roomCode || "Trực tuyến/Chưa xếp phòng",
        building: activeRoom?.building || null,
        isRoomOverridden: !!item.roomId, // Flag báo cho FE biết hôm nay có bị đổi phòng học không
      };
    });
  }
}
