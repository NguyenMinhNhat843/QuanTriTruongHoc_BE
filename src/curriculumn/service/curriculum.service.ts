import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import {
  CreateCurriculumDto,
  CurriculumDto,
  CurriculumResponseDtoWithRelation,
  SearchCurriculumDto,
  UpdateCurriculumDto,
} from "../dto/curriculum.dto";
import { plainToInstance } from "class-transformer";

@Injectable()
export class CurriculumService {
  constructor(private prisma: PrismaService) {}

  /**
   * Tạo chương trình khung
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

    const result = await this.prisma.$transaction(async (tx) => {
      // Tạo curiculum
      const curriculum = await tx.curriculum.create({
        data: curriculumData,
      });

      // Tạo curiculumSubjects
      await tx.curriculumSubject.createMany({
        data: curriculumSubjects.map((cs) => ({
          ...cs,
          curriculumId: curriculum.id,
        })),
      });

      return {
        message: "Tạo chương trình khung thành công",
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
  async findAll(query: SearchCurriculumDto): Promise<CurriculumDto[]> {
    const list = await this.prisma.curriculum.findMany({
      where: {
        majorId: query.majorId,
      },
      include: {
        major: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return plainToInstance(CurriculumDto, list);
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
   * Lấy chi tiết một chương trình khung, bao gồm cả danh sách môn học thuộc chương trình đó
   */
  async findOne(id: number): Promise<CurriculumResponseDtoWithRelation> {
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
    return plainToInstance(CurriculumResponseDtoWithRelation, curriculum);
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
      await tx.curriculum.update({
        where: { id },
        data: curriculumData,
      });

      if (curriculumSubjects) {
        await tx.curriculumSubject.deleteMany({
          where: { curriculumId: id },
        });

        // Map lại data để đảm bảo các môn học mới luôn gắn với curriculumId hiện tại
        const updatedSubjects = curriculumSubjects.map((subject) => ({
          ...subject,
          curriculumId: id, // Đảm bảo đúng ID kể cả khi client quên truyền hoặc truyền sai trong mảng
        }));

        // Thêm lại danh sách môn học mới
        await tx.curriculumSubject.createMany({
          data: updatedSubjects,
        });
      }

      return {
        message: "Cập nhật chương trình khung thành công",
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
