import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import {
  CreateCurriculumDto,
  CurriculumResponseDtoWithRelation,
  SearchCurriculumDto,
  UpdateCurriculumDto,
} from "../dto/curriculum.dto";
import { plainToInstance } from "class-transformer";
import { EnrollmentType } from "../../../prisma/generated/prisma/enums";

@Injectable()
export class CurriculumService {
  constructor(private prisma: PrismaService) {}

  /**
   * Tạo chương trình khung tích hợp Nhóm môn tự chọn
   */
  async create(data: CreateCurriculumDto) {
    const { curriculumSubjects, ...curriculumData } = data;

    // 1. Kiểm tra Ngành học có tồn tại không
    const major = await this.prisma.major.findUnique({
      where: { id: curriculumData.majorId },
    });
    if (!major) {
      throw new NotFoundException(
        `Không tìm thấy ngành học với ID ${data.majorId}`,
      );
    }

    // 2. Chạy transaction xử lý chuỗi tạo lập dữ liệu
    const result = await this.prisma.$transaction(async (tx) => {
      // Bước 2.1: Tạo Curriculum trước
      const curriculum = await tx.curriculum.create({
        data: curriculumData,
      });

      // Mảng gom tất cả CurriculumSubject sẽ insert vào DB
      const finalSubjectsToInsert: any[] = [];

      // Bước 2.2: Xử lý các môn học độc lập (Bắt buộc / Tự chọn tự do) từ client gửi lên
      if (curriculumSubjects && curriculumSubjects.length > 0) {
        curriculumSubjects.forEach((cs) => {
          finalSubjectsToInsert.push({
            curriculumId: curriculum.id,
            subjectId: cs.subjectId,
            semesterNumber: cs.semesterNumber,
            minGrade: cs.minGrade ?? 5.0,
          });
        });
      }

      // Bước 2.4: Thực hiện bulk insert tất cả các môn học vào Chương trình khung một lượt
      if (finalSubjectsToInsert.length > 0) {
        await tx.curriculumSubject.createMany({
          data: finalSubjectsToInsert,
        });
      }

      return {
        message: "Tạo chương trình khung và nhóm môn tự chọn thành công",
        curriculumId: curriculum.id,
      };
    });

    return result;
  }

  /**
   * Thống kê curriculum
   */
  async analystCurriculum(curriculumId: number) {
    if (!curriculumId) {
      return { maxSemesterNumber: 0 };
    }

    const aggregate = await this.prisma.curriculumSubject.aggregate({
      where: { curriculumId },
      _max: {
        semesterNumber: true,
      },
    });

    return {
      maxSemesterNumber: aggregate._max.semesterNumber ?? 0,
    };
  }

  /**
   * Lấy tất cả
   */
  async findAll(
    query: SearchCurriculumDto,
  ): Promise<CurriculumResponseDtoWithRelation[]> {
    const list = await this.prisma.curriculum.findMany({
      where: {
        majorId: query.majorId,
      },
      include: {
        major: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return plainToInstance(CurriculumResponseDtoWithRelation, list);
  }

  async findFirst(
    query: SearchCurriculumDto,
  ): Promise<CurriculumResponseDtoWithRelation | null> {
    const { batchId } = query;
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
    });
    const curriculumId = batch?.curriculumId;
    if (!curriculumId) {
      return null;
    }

    const curriculum = await this.prisma.curriculum.findFirst({
      where: {
        id: curriculumId,
      },
      include: {
        major: true,
        curriculumSubjects: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return curriculum
      ? plainToInstance(CurriculumResponseDtoWithRelation, curriculum)
      : null;
  }

  /**
   * Lấy chi tiết một chương trình khung, phân loại rõ ràng môn độc lập và môn theo nhóm tự chọn
   */
  async findOne(id: number): Promise<CurriculumResponseDtoWithRelation> {
    // 1. Query dữ liệu từ DB bao gồm cả Major, Subject và các ElectiveGroup
    const curriculum = await this.prisma.curriculum.findUnique({
      where: { id },
      include: {
        major: true,
        curriculumSubjects: {
          include: {
            subject: true,
          },
          orderBy: { semesterNumber: "asc" },
        },
      },
    });

    if (!curriculum) {
      throw new NotFoundException(
        `Không tìm thấy chương trình khung với ID ${id}`,
      );
    }

    const independentSubjects = curriculum.curriculumSubjects;

    // Gán lại object đã cấu trúc lại để plainToInstance map sang DTO chính xác
    const formattedCurriculum = {
      ...curriculum,
      curriculumSubjects: independentSubjects, // Chỉ chứa môn độc lập ở danh sách ngoài cùng
    };

    return plainToInstance(
      CurriculumResponseDtoWithRelation,
      formattedCurriculum,
    );
  }

  async update(id: number, data: UpdateCurriculumDto) {
    const { curriculumSubjects, ...curriculumData } = data;

    // 1. Kiểm tra Chương trình khung cần update có tồn tại không
    const existingCurriculum = await this.prisma.curriculum.findUnique({
      where: { id },
    });
    if (!existingCurriculum) {
      throw new NotFoundException(
        `Không tìm thấy chương trình khung với ID ${id}`,
      );
    }

    // 2. Nếu có update ngành học (majorId), kiểm tra ngành học mới có tồn tại không
    if (curriculumData.majorId) {
      const major = await this.prisma.major.findUnique({
        where: { id: curriculumData.majorId },
      });
      if (!major) {
        throw new NotFoundException(
          `Không tìm thấy ngành học với ID ${curriculumData.majorId}`,
        );
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // 3. Cập nhật thông tin cơ bản của Curriculum
      await tx.curriculum.update({
        where: { id },
        data: curriculumData,
      });

      if (curriculumSubjects !== undefined) {
        await tx.curriculumSubject.deleteMany({
          where: { curriculumId: id },
        });

        const finalSubjectsToInsert: any[] = [];

        if (curriculumSubjects && curriculumSubjects.length > 0) {
          curriculumSubjects.forEach((cs) => {
            finalSubjectsToInsert.push({
              curriculumId: id,
              subjectId: cs.subjectId,
              semesterNumber: cs.semesterNumber,
              enrollmentType: EnrollmentType.COMPULSORY,
              minGrade: cs.minGrade ?? 5.0,
            });
          });
        }

        if (finalSubjectsToInsert.length > 0) {
          await tx.curriculumSubject.createMany({
            data: finalSubjectsToInsert,
          });
        }
      }

      return {
        message: "Cập nhật chương trình khung và cấu trúc nhóm môn thành công",
      };
    });

    return result;
  }

  async remove(id: number) {
    await this.findOne(id);

    return await this.prisma.$transaction(async (tx) => {
      await tx.curriculumSubject.deleteMany({
        where: { curriculumId: id },
      });

      await tx.curriculum.delete({
        where: { id },
      });

      return { message: "Xóa chương trình khung thành công" };
    });
  }
}
