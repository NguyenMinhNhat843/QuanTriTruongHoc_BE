import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCurriculumDto, UpdateCurriculumDto } from "./curriculum.dto";
import { CurriculumResponseDto } from "./curriculum.response";

@Injectable()
export class CurriculumService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateCurriculumDto): Promise<CurriculumResponseDto> {
    const {
      curriculumCode,
      majorId,
      curriculumSubjects,
      curriculumName,
      effectiveFrom,
      effectiveTo,
      isActive,
      version,
      totalCredits,
    } = data;

    // 1. Kiểm tra Ngành học có tồn tại không
    const major = await this.prisma.major.findUnique({
      where: { id: majorId },
    });
    if (!major) {
      throw new NotFoundException(`Không tìm thấy ngành học với ID ${majorId}`);
    }

    // 2. Kiểm tra trùng mã chương trình khung
    const existing = await this.prisma.curriculum.findUnique({
      where: {
        curriculumCode: curriculumCode,
      },
    });
    if (existing) {
      throw new ConflictException(
        `Mã chương trình khung ${curriculumCode} đã tồn tại`,
      );
    }

    try {
      const result = await this.prisma.curriculum.create({
        data: {
          curriculumCode,
          curriculumName,
          majorId,
          effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : null,
          effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
          isActive,
          version,
          totalCredits,
          curriculumSubjects: {
            create: curriculumSubjects.map((item) => {
              return {
                semesterNumber: item.semesterNumber,
                subjectId: item.subjectId,
                minGrade: item.minGrade,
                isMandatory: item.isMandatory,
              };
            }),
          },
        },
        include: {
          major: true,
          curriculumSubjects: {
            include: {
              subject: true,
            },
          },
        },
      });
      return new CurriculumResponseDto(result);
    } catch (error) {
      console.error("Error creating curriculum:", error);
      throw new InternalServerErrorException(
        "Lỗi hệ thống khi tạo chương trình khung",
      );
    }
  }

  async findAll(): Promise<CurriculumResponseDto[]> {
    const list = await this.prisma.curriculum.findMany({
      include: {
        major: true,
        _count: { select: { curriculumSubjects: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return list.map((item) => new CurriculumResponseDto(item));
  }

  async findOne(id: number): Promise<CurriculumResponseDto> {
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
    return new CurriculumResponseDto(curriculum);
    // return curriculum;
  }

  async update(id: number, data: UpdateCurriculumDto) {
    const {
      curriculumCode,
      majorId,
      curriculumSubjects, // Danh sách môn học mới từ request
      effectiveFrom,
      effectiveTo,
      isActive,
      version,
      totalCredits,
      curriculumName,
    } = data;

    // 1. Kiểm tra chương trình khung có tồn tại không
    const existingCurriculum = await this.prisma.curriculum.findUnique({
      where: { id },
    });
    if (!existingCurriculum) {
      throw new NotFoundException(
        `Không tìm thấy chương trình khung với ID ${id}`,
      );
    }

    // 2. Nếu có cập nhật mã, kiểm tra xem mã mới có bị trùng với bản ghi khác không
    if (
      curriculumCode &&
      curriculumCode !== existingCurriculum.curriculumCode
    ) {
      const duplicateCode = await this.prisma.curriculum.findUnique({
        where: { curriculumCode },
      });
      if (duplicateCode) {
        throw new ConflictException(
          `Mã chương trình khung ${curriculumCode} đã tồn tại`,
        );
      }
    }

    // 3. Nếu có cập nhật Ngành học, kiểm tra ngành học mới có tồn tại không
    if (majorId) {
      const major = await this.prisma.major.findUnique({
        where: { id: majorId },
      });
      if (!major)
        throw new NotFoundException(
          `Không tìm thấy ngành học với ID ${majorId}`,
        );
    }

    try {
      return await this.prisma.curriculum.update({
        where: { id },
        data: {
          curriculumCode,
          curriculumName,
          majorId,
          version,
          totalCredits,
          isActive,
          effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : undefined,
          effectiveTo: effectiveTo ? new Date(effectiveTo) : undefined,

          // Xử lý danh sách môn học: Xóa hết cũ, thêm mới (Atomic Update)
          curriculumSubjects: curriculumSubjects
            ? {
                deleteMany: {}, // Xóa tất cả các môn học cũ thuộc curriculum này
                create: curriculumSubjects.map((item) => ({
                  semesterNumber: item.semesterNumber,
                  subjectId: item.subjectId,
                  minGrade: item.minGrade ?? 5,
                  isMandatory: item.isMandatory ?? true,
                })),
              }
            : undefined,
        },
        include: {
          major: true,
          curriculumSubjects: true,
        },
      });
    } catch (error) {
      console.error("Error updating curriculum:", error);
      throw new InternalServerErrorException(
        "Lỗi hệ thống khi cập nhật chương trình khung",
      );
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.curriculum.delete({ where: { id } });
  }
}
