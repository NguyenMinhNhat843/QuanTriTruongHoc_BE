import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateSubjectDto,
  ResponseSubjectDto,
  SearchSubjectDto,
  UpdateSubjectDto,
} from "./subject.dto";
import { plainToInstance } from "class-transformer";
import { Prisma } from "../../prisma/generated/prisma/client";

@Injectable()
export class SubjectService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateSubjectDto): Promise<ResponseSubjectDto> {
    const { subjectCode, ...subjectData } = data;

    const existingSubject = await this.prisma.subject.findUnique({
      where: { subjectCode },
    });
    if (existingSubject) {
      throw new ConflictException(`Mã môn học ${subjectCode} đã tồn tại`);
    }

    try {
      const newSubject = await this.prisma.$transaction(async (tx) => {
        const subject = await tx.subject.create({
          data: {
            ...subjectData,
            subjectCode,
          },
        });

        return subject;
      });

      return plainToInstance(ResponseSubjectDto, newSubject);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      console.log("Lỗi tạo môn học:", error);
      throw new InternalServerErrorException(
        "Lỗi hệ thống khi tạo môn học kèm cấu hình điểm",
      );
    }
  }

  async findAll(query: SearchSubjectDto): Promise<ResponseSubjectDto[]> {
    const { id, departmentId, subjectCode, subjectName, keyword, majorId } =
      query;

    const where: Prisma.SubjectWhereInput = {};

    if (majorId) {
      const major = await this.prisma.major.findUnique({
        where: { id: majorId },
        select: { deptId: true },
      });

      if (!major) {
        return [];
      }

      where.departmentId = major.deptId;
    }

    // 2. Nếu client vừa truyền majorId vừa truyền departmentId, ưu tiên/kết hợp kiểm tra khớp nhau
    if (departmentId) {
      // Nếu đã có where.departmentId từ bước majorId mà lại khác với departmentId truyền vào trực tiếp
      if (where.departmentId && where.departmentId !== departmentId) {
        return []; // Mâu thuẫn điều kiện tìm kiếm -> Không có kết quả khớp
      }
      where.departmentId = departmentId;
    }

    // 3. Lọc theo các trường cơ bản (Khớp chính xác)
    if (id) {
      where.id = id;
    }
    if (subjectCode) {
      where.subjectCode = subjectCode;
    }
    if (subjectName) {
      where.subjectName = subjectName;
    }

    // 4. Xử lý tìm kiếm theo keyword (Tìm kiếm tương đối theo Code hoặc Name)
    if (keyword) {
      where.OR = [
        { subjectCode: { contains: keyword, mode: "insensitive" } },
        { subjectName: { contains: keyword, mode: "insensitive" } },
      ];
    }

    // 5. Query DB và map data sang Response DTO
    const subjects = await this.prisma.subject.findMany({ where });

    return plainToInstance(ResponseSubjectDto, subjects);
  }

  /**
   * Lấy chi tiết môn học theo id với cấu hình điểm
   */
  async findOne(id: number): Promise<ResponseSubjectDto> {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
    });

    if (!subject) {
      throw new NotFoundException(`Không tìm thấy môn học với ID ${id}`);
    }

    return plainToInstance(ResponseSubjectDto, subject);
  }

  /**
   * Lấy danh sách môn học của 1 học kỳ của 1 lớp học
   */
  async getSubjectsByClassAndSemester(classId: number, semesterId: number) {
    // 1. Lấy thông tin Lớp và Khóa đào tạo để có startYear và curriculumId
    const classInfo = await this.prisma.class.findUnique({
      where: { id: classId },
      include: { batch: true },
    });

    if (!classInfo) {
      throw new NotFoundException(`Không tìm thấy lớp học có ID ${classId}`);
    }
    if (!classInfo.batch || !classInfo.batch.curriculumId) {
      throw new BadRequestException(
        "Lớp học chưa được gán Khóa đào tạo hoặc Chương trình khung.",
      );
    }

    const { batch } = classInfo;

    // 2. Lấy thông tin Học kỳ thực tế để lấy thông số year và term
    const semester = await this.prisma.semester.findUnique({
      where: { id: semesterId },
    });

    if (!semester) {
      throw new NotFoundException(`Không tìm thấy học kỳ có ID ${semesterId}`);
    }
    if (!semester.year || !semester.term) {
      throw new BadRequestException(
        "Học kỳ thực tế thiếu dữ liệu năm học (year) hoặc kỳ học (term).",
      );
    }

    // 3. Công thức tính số học kỳ tương ứng trong chương trình khung (semesterNumber)
    const yearDiff = semester.year - batch.startYear;
    const semesterNumber = yearDiff * 2 + semester.term;

    if (semesterNumber <= 0) {
      throw new BadRequestException(
        "Học kỳ truyền vào diễn ra trước khi Khóa học bắt đầu.",
      );
    }

    // 4. Lấy chi tiết chương trình khung theo semesterNumber vừa tính được
    const curriculumSubjects = await this.prisma.curriculumSubject.findMany({
      where: {
        curriculumId: batch.curriculumId!,
        semesterNumber: semesterNumber,
      },
      include: {
        subject: true,
      },
    });

    const subjectsReturn = curriculumSubjects.map((item) => item.subject);
    return plainToInstance(ResponseSubjectDto, subjectsReturn);
  }

  /**
   * Update môn học
   */
  async update(
    id: number,
    data: UpdateSubjectDto,
  ): Promise<ResponseSubjectDto> {
    try {
      const updatedSubject = await this.prisma.$transaction(async (tx) => {
        return tx.subject.update({
          where: { id },
          data,
        });
      });

      return plainToInstance(ResponseSubjectDto, updatedSubject);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      console.log("Lỗi cập nhật môn học:", error);
      throw new InternalServerErrorException(
        "Lỗi hệ thống khi cập nhật môn học và cấu hình điểm",
      );
    }
  }

  async remove(id: number) {
    const subject = await this.findOne(id);
    return this.prisma.subject.delete({ where: { id: subject.id } });
  }
}
