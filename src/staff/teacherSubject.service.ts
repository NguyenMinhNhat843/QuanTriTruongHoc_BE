import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateTeacherSubjectDto,
  CreateTeacherSubjectManyDto,
  TeacherSubjectResponseDto,
} from "./teacherSubject.dto";
import { plainToInstance } from "class-transformer";
import { Prisma } from "../../prisma/generated/prisma/client";

@Injectable()
export class TeacherSubjectService {
  constructor(private prisma: PrismaService) {}

  /**
   * 1. CREATE: Gán một môn học cho giáo viên
   * Kiểm tra trùng lặp dựa trên unique constraint [teacherId, subjectId]
   */
  async create(
    body: CreateTeacherSubjectDto,
  ): Promise<TeacherSubjectResponseDto> {
    const { teacherId, subjectId } = body;

    // Kiểm tra xem liên kết này đã tồn tại chưa để tránh crash db
    const existing = await this.prisma.teacherSubject.findUnique({
      where: {
        teacherId_subjectId: { teacherId, subjectId },
      },
    });

    if (existing) {
      throw new BadRequestException(
        "Giáo viên này đã được phân công môn học này rồi.",
      );
    }

    const result = await this.prisma.teacherSubject.create({
      data: {
        teacherId,
        subjectId,
      },
      // Thêm include nếu bạn muốn trả về luôn thông tin giáo viên và môn học
      include: {
        teacher: true,
        subject: true,
      },
    });

    return plainToInstance(TeacherSubjectResponseDto, result);
  }

  async createMany(
    body: CreateTeacherSubjectManyDto,
  ): Promise<TeacherSubjectResponseDto[]> {
    const { teacherId, subjectIds } = body;

    if (!subjectIds || subjectIds.length === 0) {
      throw new BadRequestException(
        "Danh sách môn học chọn phân công không được để trống.",
      );
    }

    const existingAssignments = await this.prisma.teacherSubject.findMany({
      where: {
        teacherId,
        subjectId: { in: subjectIds },
      },
      select: { subjectId: true },
    });

    const existingSubjectIds = existingAssignments.map((a) => a.subjectId);

    const newSubjectIds = subjectIds.filter(
      (id) => !existingSubjectIds.includes(id),
    );

    if (newSubjectIds.length === 0) {
      throw new BadRequestException(
        "Tất cả các môn học được chọn đều đã được phân công cho giáo viên này từ trước.",
      );
    }

    const results = await this.prisma.$transaction(
      newSubjectIds.map((subjectId) =>
        this.prisma.teacherSubject.create({
          data: {
            teacherId,
            subjectId,
          },
          include: {
            teacher: true,
            subject: true,
          },
        }),
      ),
    );

    // 4. Map kết quả trả về thông qua plainToInstance
    return results.map((result) =>
      plainToInstance(TeacherSubjectResponseDto, result),
    );
  }

  /**
   * 2. READ: Lấy danh sách tất cả các phân công (có phân trang cơ bản)
   */
  async findAll(): Promise<TeacherSubjectResponseDto[]> {
    const records = await this.prisma.teacherSubject.findMany({
      include: {
        teacher: true,
        subject: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return records.map((record) =>
      plainToInstance(TeacherSubjectResponseDto, record),
    );
  }

  /**
   * 2b. READ: Lấy một bản ghi cụ thể theo ID
   */
  async findOne(id: number): Promise<TeacherSubjectResponseDto> {
    const record = await this.prisma.teacherSubject.findUnique({
      where: { id },
      include: {
        teacher: true,
        subject: true,
      },
    });

    if (!record) {
      throw new NotFoundException(
        `Không tìm thấy bản ghi phân công với ID ${id}`,
      );
    }

    return plainToInstance(TeacherSubjectResponseDto, record);
  }

  /**
   * 2c. READ: Lấy tất cả môn học của một giáo viên cụ thể
   */
  async findByTeacher(teacherId: number): Promise<TeacherSubjectResponseDto[]> {
    const records = await this.prisma.teacherSubject.findMany({
      where: { teacherId },
      include: {
        subject: true,
      },
    });
    return records.map((record) =>
      plainToInstance(TeacherSubjectResponseDto, record),
    );
  }

  /**
   * 3. UPDATE: Cập nhật thông tin phân công theo ID
   */
  async update(
    id: number,
    data: { teacherId?: number; subjectId?: number },
  ): Promise<TeacherSubjectResponseDto> {
    await this.findOne(id);

    try {
      const result = await this.prisma.teacherSubject.update({
        where: { id },
        data,
        include: {
          teacher: true,
          subject: true,
        },
      });
      return plainToInstance(TeacherSubjectResponseDto, result);
    } catch (error) {
      // Xử lý trường hợp update thông tin trùng với một cặp unique có sẵn
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new BadRequestException(
          "Cặp Giáo viên và Môn học này đã tồn tại trong hệ thống.",
        );
      }
      throw error;
    }
  }

  /**
   * 4. DELETE: Xóa phân công (Hủy gán môn học khỏi giáo viên)
   */
  async remove(id: number): Promise<{ message: string }> {
    // Kiểm tra xem bản ghi có tồn tại không
    await this.findOne(id);

    await this.prisma.teacherSubject.delete({
      where: { id },
    });

    return { message: `Xóa thành công phân công có ID ${id}` };
  }

  /**
   * 4b. DELETE: Xóa dựa vào cặp unique (Không cần biết ID của bảng trung gian)
   */
  async removeByUniquePair(
    teacherId: number,
    subjectId: number,
  ): Promise<{ message: string }> {
    try {
      await this.prisma.teacherSubject.delete({
        where: {
          teacherId_subjectId: { teacherId, subjectId },
        },
      });
      return { message: "Hủy phân công môn học thành công." };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new NotFoundException(
          "Không tìm thấy dữ liệu phân công phù hợp để xóa.",
        );
      }
      throw error;
    }
  }
}
