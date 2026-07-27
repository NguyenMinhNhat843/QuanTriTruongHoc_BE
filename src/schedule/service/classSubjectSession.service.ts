import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import {
  CreateClassSubjectSessionDto,
  SearchClassSubjectSessionDto,
  UpdateClassSubjectSessionDto,
  ValidateSessionOverlapDto,
} from "../dto/classSubjectSession.dto";
@Injectable()
export class ClassSubjectSessionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateClassSubjectSessionDto) {
    return this.prisma.classSubjectSession.create({
      data: createDto,
    });
  }

  /**
   * Helper kiểm tra 2 khoảng tiết học có giao nhau không
   * Ví dụ: Session A (tiết 1-3) và Session B (tiết 3-5) -> Giao nhau tiết 3
   */
  private isPeriodOverlap(startA: number, endA: number, startB: number, endB: number): boolean {
    return startA <= endB && startB <= endA;
  }

  //   Check lịch trùng trong 1 học kỳ
  async validateSessionOverlap(dto: ValidateSessionOverlapDto): Promise<void> {
    const { classSubjectId, dayOfWeek, shift, startPeriod, endPeriod, roomId, teacherId, excludeSessionId } = dto;

    // Lấy thông tin lớp học phần hiện tại để biết semesterId
    const currentClassSubject = await this.prisma.classSubject.findUnique({
      where: { id: classSubjectId },
      include: {
        subject: true,
        baseClass: true,
      },
    });

    if (!currentClassSubject) {
      throw new BadRequestException("Lớp học phần không tồn tại.");
    }

    const effectiveTeacherId = teacherId ?? currentClassSubject.teacherId;

    // Tìm tất cả các Session cùng Học kỳ, cùng Thứ, cùng Ca học (Shift)
    const existingSessions = await this.prisma.classSubjectSession.findMany({
      where: {
        dayOfWeek,
        shift,
        classSubject: {
          semesterId: currentClassSubject.semesterId, // Chỉ check trong cùng học kỳ
        },
        ...(excludeSessionId ? { NOT: { id: excludeSessionId } } : {}),
      },
      include: {
        room: true,
        classSubject: {
          include: {
            subject: true,
            baseClass: true,
            teacher: true,
          },
        },
      },
    });

    for (const session of existingSessions) {
      // Bước 1: Kiểm tra xem tiết học có giao nhau hay không
      const hasPeriodOverlap = this.isPeriodOverlap(startPeriod, endPeriod, session.startPeriod, session.endPeriod);

      if (!hasPeriodOverlap) continue; // Không dính tiết -> Bỏ qua

      const otherClassSubject = session.classSubject;
      const subjectName = otherClassSubject.subject?.subjectName || "Chưa rõ môn";
      const className = otherClassSubject.baseClass?.className || "Lớp tự do";
      const teacherName = otherClassSubject.teacher?.fullName || "Chưa gán GV";

      // Bước 2: Kiểm tra trùng Lịch Giảng Viên
      if (effectiveTeacherId && otherClassSubject.teacherId === effectiveTeacherId) {
        throw new BadRequestException(
          `Trùng lịch Giảng viên (${teacherName}): Đã có lịch dạy môn "${subjectName}" - Lớp "${className}" vào ${dayOfWeek}, Ca ${shift}, Tiết ${session.startPeriod}-${session.endPeriod}.`,
        );
      }

      // Bước 3: Kiểm tra trùng Lịch Phòng Học
      if (roomId && session.roomId && session.roomId === roomId) {
        const roomCode = session.room?.roomCode || `ID:${roomId}`;
        throw new BadRequestException(
          `Trùng Phòng học (${roomCode}): Phòng đã được xếp cho môn "${subjectName}" - Lớp "${className}" (${teacherName}) vào ${dayOfWeek}, Ca ${shift}, Tiết ${session.startPeriod}-${session.endPeriod}.`,
        );
      }
    }
  }

  async findAll(query: SearchClassSubjectSessionDto) {
    return this.prisma.classSubjectSession.findMany({
      where: {
        classSubjectId: query.classSubjectId ? Number(query.classSubjectId) : undefined,
        roomId: query.roomId ? Number(query.roomId) : undefined,
        dayOfWeek: query.dayOfWeek,
        shift: query.shift,
        startPeriod: query.startPeriod ? Number(query.startPeriod) : undefined,
        endPeriod: query.endPeriod ? Number(query.endPeriod) : undefined,
      },
      include: {
        room: true,
        classSubject: {
          include: {
            subject: true,
            teacher: true,
            baseClass: true,
          },
        },
        schedules: true,
      },
    });
  }

  async findOne(id: number) {
    const session = await this.prisma.classSubjectSession.findUnique({
      where: { id },
      include: {
        room: true,
        classSubject: {
          include: {
            subject: true,
            teacher: true,
            baseClass: true,
          },
        },
        schedules: true,
      },
    });
    if (!session) {
      throw new NotFoundException(`ClassSubjectSession with ID ${id} not found`);
    }
    return session;
  }
  async update(id: number, updateDto: UpdateClassSubjectSessionDto) {
    await this.findOne(id);
    return this.prisma.classSubjectSession.update({
      where: { id },
      data: updateDto,
    });
  }
  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.classSubjectSession.delete({
      where: { id },
    });
  }
}
