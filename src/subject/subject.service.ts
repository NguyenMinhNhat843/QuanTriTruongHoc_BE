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
} from "./dto/subject.dto";
import { plainToInstance } from "class-transformer";
import { KnowledgeBlock, Prisma } from "../../prisma/generated/prisma/client";

@Injectable()
export class SubjectService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateSubjectDto): Promise<ResponseSubjectDto> {
    const { subjectCode, subjectConditions, ...subjectData } = data;

    // 1. Kiểm tra logic nghiệp vụ: Khoa vs Khối kiến thức
    // Nếu có chọn Khoa (departmentId có giá trị), khối kiến thức KHÔNG ĐƯỢC là GENERAL
    if (
      subjectData.departmentId &&
      subjectData.knowledgeBlock === KnowledgeBlock.GENERAL
    ) {
      throw new BadRequestException(
        "Môn học thuộc một Khoa cụ thể thì không thể là khối kiến thức Đại cương (GENERAL). Vui lòng chọn Cơ sở ngành hoặc Chuyên ngành.",
      );
    }

    // 2. Kiểm tra trùng mã môn học
    const existingSubject = await this.prisma.subject.findUnique({
      where: { subjectCode },
    });
    if (existingSubject) {
      throw new ConflictException(`Mã môn học ${subjectCode} đã tồn tại`);
    }

    try {
      const newSubject = await this.prisma.$transaction(async (tx) => {
        // Bước 2.1: Tạo môn học chính trước để lấy ID
        const subject = await tx.subject.create({
          data: {
            ...subjectData,
            subjectCode,
          },
        });

        // Bước 2.2: Nếu có cấu hình môn điều kiện, tiến hành xử lý
        if (subjectConditions && subjectConditions.length > 0) {
          // Kiểm tra xem các conditionSubjectId truyền lên có thực sự tồn tại trong DB không
          const conditionIds = subjectConditions.map(
            (c) => c.conditionSubjectId,
          );
          const existingConditionsCount = await tx.subject.count({
            where: { id: { in: conditionIds } },
          });

          if (existingConditionsCount !== conditionIds.length) {
            throw new BadRequestException(
              "Một hoặc nhiều môn học điều kiện (tiên quyết/song hành) không tồn tại trên hệ thống",
            );
          }

          // Tạo danh sách bản ghi điều kiện để gán vào bảng trung gian
          const conditionsToCreate = subjectConditions.map((cond) => ({
            subjectId: subject.id, // ID của môn vừa tạo
            conditionSubjectId: cond.conditionSubjectId,
            conditionType: cond.conditionType,
          }));

          // Tiến hành bulk-insert điều kiện môn học
          await tx.subjectCondition.createMany({
            data: conditionsToCreate,
          });
        }

        // Query lại full thông tin môn học vừa tạo kèm quan hệ (nếu cần thiết cho ResponseSubjectDto)
        return tx.subject.findUnique({
          where: { id: subject.id },
          include: {
            asSubject: true, // Bao gồm cả cấu hình điều kiện vừa tạo
          },
        });
      });

      return plainToInstance(ResponseSubjectDto, newSubject);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      console.error("Lỗi tạo môn học:", error);
      throw new InternalServerErrorException(
        "Lỗi hệ thống khi tạo môn học kèm cấu hình điều kiện tiên quyết/song hành",
      );
    }
  }

  async findAll(query: SearchSubjectDto): Promise<ResponseSubjectDto[]> {
    const { id, departmentId, subjectCode, subjectName, keyword, majorId } =
      query;

    const andConditions: Prisma.SubjectWhereInput[] = [];

    // 1. Logic lọc theo Ngành học (majorId)
    if (majorId) {
      const major = await this.prisma.major.findUnique({
        where: { id: majorId },
        select: { deptId: true },
      });
      if (!major) return [];
      andConditions.push({ departmentId: major.deptId });
    }

    // 2. Logic lọc/kết hợp theo Khoa (departmentId)
    if (departmentId) {
      const existingDeptCondition = andConditions.find(
        (c) => c.departmentId !== undefined,
      );
      if (
        existingDeptCondition &&
        existingDeptCondition.departmentId !== departmentId
      ) {
        return [];
      }
      if (!existingDeptCondition) {
        andConditions.push({ departmentId });
      }
    }

    // 3. Khớp chính xác (hoặc tương đối tùy bạn cấu hình)
    if (id) andConditions.push({ id });
    if (subjectCode)
      andConditions.push({
        subjectCode: { contains: subjectCode, mode: "insensitive" },
      });
    if (subjectName)
      andConditions.push({
        subjectName: { contains: subjectName, mode: "insensitive" },
      });

    // 4. Tìm kiếm theo từ khóa keyword
    if (keyword) {
      andConditions.push({
        OR: [
          { subjectCode: { contains: keyword, mode: "insensitive" } },
          { subjectName: { contains: keyword, mode: "insensitive" } },
        ],
      });
    }

    const where: Prisma.SubjectWhereInput =
      andConditions.length > 0 ? { AND: andConditions } : {};

    // 5. Query tối ưu hóa dữ liệu trả về
    const subjects = await this.prisma.subject.findMany({
      where,
      orderBy: { subjectCode: "asc" },
    });

    return plainToInstance(ResponseSubjectDto, subjects);
  }

  /**
   * Lấy chi tiết môn học kèm theo cấu hình môn tiên quyết và song hành
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
    const { subjectConditions, ...subjectData } = data;

    // 1. Kiểm tra Môn học cần update có tồn tại không
    const existingSubject = await this.prisma.subject.findUnique({
      where: { id },
    });
    if (!existingSubject) {
      throw new NotFoundException(`Không tìm thấy môn học với ID ${id}`);
    }

    // 2. Hợp nhất dữ liệu cũ và mới để validate logic Khoa và Khối kiến thức
    const finalDepartmentId =
      subjectData.departmentId !== undefined
        ? subjectData.departmentId
        : existingSubject.departmentId;
    const finalKnowledgeBlock =
      subjectData.knowledgeBlock !== undefined
        ? subjectData.knowledgeBlock
        : existingSubject.knowledgeBlock;

    if (finalDepartmentId && finalKnowledgeBlock === KnowledgeBlock.GENERAL) {
      throw new BadRequestException(
        "Môn học thuộc một Khoa cụ thể thì không thể là khối kiến thức Đại cương (GENERAL). Vui lòng chọn Cơ sở ngành hoặc Chuyên ngành.",
      );
    }

    try {
      const updatedSubject = await this.prisma.$transaction(async (tx) => {
        // Bước 3.1: Cập nhật thông tin cơ bản của Subject
        await tx.subject.update({
          where: { id },
          data: subjectData,
        });

        // Chỉ xử lý lại điều kiện môn học nếu mảng này được truyền lên (kể cả mảng rỗng `[]`)
        if (subjectConditions !== undefined) {
          // Xóa sạch các cấu hình môn điều kiện cũ của môn học này
          await tx.subjectCondition.deleteMany({
            where: { subjectId: id },
          });

          if (subjectConditions.length > 0) {
            const conditionIds = subjectConditions.map(
              (c) => c.conditionSubjectId,
            );

            // Chặn lỗi logic: Môn học không thể làm môn tiên quyết/song hành của chính nó
            if (conditionIds.includes(id)) {
              throw new BadRequestException(
                "Môn học không thể thiết lập điều kiện tiên quyết hoặc song hành với chính nó.",
              );
            }

            // Kiểm tra xem các môn điều kiện mới có tồn tại trong hệ thống hay không
            const existingConditionsCount = await tx.subject.count({
              where: { id: { in: conditionIds } },
            });

            if (existingConditionsCount !== conditionIds.length) {
              throw new BadRequestException(
                "Một hoặc nhiều môn học điều kiện (tiên quyết/song hành) không tồn tại trên hệ thống",
              );
            }

            // Chuẩn bị dữ liệu nạp lại vào bảng trung gian
            const conditionsToCreate = subjectConditions.map((cond) => ({
              subjectId: id,
              conditionSubjectId: cond.conditionSubjectId,
              conditionType: cond.conditionType,
            }));

            // Bulk-insert lại danh sách điều kiện mới
            await tx.subjectCondition.createMany({
              data: conditionsToCreate,
            });
          }
        }

        // Query lại full thông tin môn học sau khi cập nhật để trả về đúng DTO
        return tx.subject.findUnique({
          where: { id },
          include: {
            asSubject: true, // Trả ra kèm danh sách điều kiện hiện tại
          },
        });
      });

      return plainToInstance(ResponseSubjectDto, updatedSubject);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      console.error("Lỗi cập nhật môn học:", error);
      throw new InternalServerErrorException(
        "Lỗi hệ thống khi cập nhật môn học và cấu hình điều kiện tiên quyết/song hành",
      );
    }
  }

  async remove(id: number) {
    // 1. Kiểm tra môn học có tồn tại hay không
    const subject = await this.prisma.subject.findUnique({
      where: { id },
    });
    if (!subject) {
      throw new NotFoundException(`Không tìm thấy môn học với ID ${id}`);
    }

    // 2. Kiểm tra xem môn học này có đang được sử dụng ở các cấu hình khác không
    // (Chặn xóa nếu dính liên kết ON DELETE Restrict)
    const [usedInCurriculumCount, usedAsConditionCount] = await Promise.all([
      // Kiểm tra xem môn học đã được kéo vào Chương trình khung nào chưa
      this.prisma.curriculumSubject.count({
        where: { subjectId: id },
      }),
      // Kiểm tra xem môn này có đang làm môn ĐIỀU KIỆN (tiên quyết/song hành) của môn khác không
      this.prisma.subjectCondition.count({
        where: { conditionSubjectId: id },
      }),
    ]);

    if (usedInCurriculumCount > 0) {
      throw new BadRequestException(
        `Không thể xóa môn học này vì nó đang thuộc về ${usedInCurriculumCount} chương trình khung. Vui lòng gỡ môn học khỏi các chương trình khung trước.`,
      );
    }

    if (usedAsConditionCount > 0) {
      throw new BadRequestException(
        `Không thể xóa môn học này vì nó đang là môn điều kiện (tiên quyết/song hành) của môn học khác.`,
      );
    }

    try {
      // 3. Nếu mọi điều kiện an toàn, tiến hành xóa môn học
      // Lưu ý: Các điều kiện do CHÍNH môn này yêu cầu (bảng subjectCondition có subjectId = id)
      // sẽ tự động được xóa sạch vì ta cấu hình ON DELETE Cascade ở vai trò "CurrentSubject".
      await this.prisma.subject.delete({
        where: { id },
      });

      return {
        message: `Xóa thành công môn học [${subject.subjectCode}] ${subject.subjectName}`,
      };
    } catch (error) {
      console.error("Lỗi khi xóa môn học:", error);
      throw new InternalServerErrorException(
        "Gặp lỗi hệ thống không thể xóa môn học lúc này.",
      );
    }
  }
}
