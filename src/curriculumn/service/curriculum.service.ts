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
    const { curriculumSubjects, electiveGroups, ...curriculumData } = data;

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
            electiveGroupId: null, // Môn độc lập thì không thuộc nhóm nào
          });
        });
      }

      // Bước 2.3: Xử lý các Nhóm môn tự chọn (nếu có)
      if (electiveGroups && electiveGroups.length > 0) {
        for (const group of electiveGroups) {
          const { subjects, ...groupData } = group;

          // Tạo bản ghi Nhóm môn tự chọn để lấy ID
          const createdGroup = await tx.electiveGroup.create({
            data: {
              ...groupData,
              curriculumId: curriculum.id,
            },
          });

          // Đẩy toàn bộ môn thuộc nhóm này vào mảng chờ insert
          subjects.forEach((sub) => {
            finalSubjectsToInsert.push({
              curriculumId: curriculum.id,
              subjectId: sub.subjectId,
              semesterNumber: sub.semesterNumber,
              enrollmentType: EnrollmentType.ELECTIVE, // Ép buộc là ELECTIVE vì nằm trong nhóm tự chọn
              minGrade: sub.minGrade ?? 5.0,
              electiveGroupId: createdGroup.id, // Gắn ID nhóm vừa sinh ra
            });
          });
        }
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
        // Lấy danh sách nhóm tự chọn, đồng thời lôi luôn các môn thuộc nhóm đó ra
        electiveGroups: {
          include: {
            curriculumSubjects: {
              include: {
                subject: true,
              },
              orderBy: { semesterNumber: "asc" },
            },
          },
          orderBy: { id: "asc" },
        },
        // Lấy toàn bộ môn học gắn với chương trình khung này
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

    // 2. Định hình lại dữ liệu (Format Response)
    // Lọc mảng curriculumSubjects gốc: CHỈ giữ lại môn độc lập (electiveGroupId === null)
    const independentSubjects = curriculum.curriculumSubjects.filter(
      (cs) => cs.electiveGroupId === null,
    );

    // Gán lại object đã cấu trúc lại để plainToInstance map sang DTO chính xác
    const formattedCurriculum = {
      ...curriculum,
      curriculumSubjects: independentSubjects, // Chỉ chứa môn độc lập ở danh sách ngoài cùng
      electiveGroups: curriculum.electiveGroups, // Đã có sẵn môn theo từng group do include ở trên
    };

    return plainToInstance(
      CurriculumResponseDtoWithRelation,
      formattedCurriculum,
    );
  }

  async update(id: number, data: UpdateCurriculumDto) {
    const { curriculumSubjects, electiveGroups, ...curriculumData } = data;

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

      // Chỉ thực hiện xử lý lại môn học & nhóm tự chọn nếu client có truyền 1 trong 2 mảng này lên
      // (Nếu họ chỉ muốn cập nhật tên CTK hoặc trạng thái isActive thì bỏ qua bước này)
      if (curriculumSubjects !== undefined || electiveGroups !== undefined) {
        // BƯỚC A: XÓA SẠCH DỮ LIỆU CŨ ĐỂ RE-CREATE
        // Do trong Schema thiết kế ON DELETE CASCADE từ Curriculum -> ElectiveGroup và Curriculum -> CurriculumSubject
        // Nhưng ở đây ta KHÔNG xóa Curriculum mà chỉ làm sạch detail, nên phải chủ động tự gọi deleteMany:

        // Xóa tất cả môn học cũ thuộc chương trình khung này
        await tx.curriculumSubject.deleteMany({
          where: { curriculumId: id },
        });

        // Xóa tất cả các nhóm tự chọn cũ thuộc chương trình khung này
        await tx.electiveGroup.deleteMany({
          where: { curriculumId: id },
        });

        // Mảng gom tất cả CurriculumSubject mới để tiến hành bulk-insert
        const finalSubjectsToInsert: any[] = [];

        // BƯỚC B: XỬ LÝ NẠP LẠI DỮ LIỆU MỚI

        // 1. Xử lý các môn học độc lập (Bắt buộc / Tự chọn tự do)
        if (curriculumSubjects && curriculumSubjects.length > 0) {
          curriculumSubjects.forEach((cs) => {
            finalSubjectsToInsert.push({
              curriculumId: id,
              subjectId: cs.subjectId,
              semesterNumber: cs.semesterNumber,
              enrollmentType: EnrollmentType.COMPULSORY,
              minGrade: cs.minGrade ?? 5.0,
              electiveGroupId: null,
            });
          });
        }

        // 2. Xử lý các nhóm tự chọn và các môn nằm trong nhóm đó
        if (electiveGroups && electiveGroups.length > 0) {
          for (const group of electiveGroups) {
            const { subjects, ...groupData } = group;

            // Tạo lại nhóm tự chọn mới để sinh ID mới
            const createdGroup = await tx.electiveGroup.create({
              data: {
                ...groupData,
                curriculumId: id,
              },
            });

            // Map các môn thuộc nhóm này vào mảng bulk-insert
            subjects.forEach((sub) => {
              finalSubjectsToInsert.push({
                curriculumId: id,
                subjectId: sub.subjectId,
                semesterNumber: sub.semesterNumber,
                enrollmentType: EnrollmentType.ELECTIVE, // Luôn là ELECTIVE khi nằm trong group tự chọn
                minGrade: sub.minGrade ?? 5.0,
                electiveGroupId: createdGroup.id, // Gắn ID nhóm vừa sinh
              });
            });
          }
        }

        // BƯỚC C: BULK INSERT LẠI TOÀN BỘ MÔN HỌC
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
