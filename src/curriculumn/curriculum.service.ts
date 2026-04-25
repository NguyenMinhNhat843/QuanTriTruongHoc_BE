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
    const { curriculumCode, majorId } = data;

    // 1. Kiểm tra Ngành học có tồn tại không
    const major = await this.prisma.major.findUnique({
      where: { id: majorId },
    });
    if (!major) {
      throw new NotFoundException(`Không tìm thấy ngành học với ID ${majorId}`);
    }

    // 2. Kiểm tra trùng mã chương trình khung
    const existing = await this.prisma.curriculum.findUnique({
      where: { curriculumCode },
    });
    if (existing) {
      throw new ConflictException(
        `Mã chương trình khung ${curriculumCode} đã tồn tại`,
      );
    }

    try {
      const curriculum = await this.prisma.curriculum.create({
        data: {
          ...data,
          effectiveFrom: data.effectiveFrom
            ? new Date(data.effectiveFrom)
            : null,
          effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
        },
        include: { major: true },
      });
      return new CurriculumResponseDto(curriculum);
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
        _count: { select: { curriculumSubjects: true } },
      },
    });

    if (!curriculum) {
      throw new NotFoundException(
        `Không tìm thấy chương trình khung với ID ${id}`,
      );
    }
    return new CurriculumResponseDto(curriculum);
  }

  async update(
    id: number,
    data: UpdateCurriculumDto,
  ): Promise<CurriculumResponseDto> {
    await this.findOne(id); // Kiểm tra tồn tại

    if (data.majorId) {
      const major = await this.prisma.major.findUnique({
        where: { id: data.majorId },
      });
      if (!major) throw new NotFoundException("Ngành học không tồn tại");
    }

    try {
      const updated = await this.prisma.curriculum.update({
        where: { id },
        data: {
          ...data,
          effectiveFrom: data.effectiveFrom
            ? new Date(data.effectiveFrom)
            : undefined,
          effectiveTo: data.effectiveTo
            ? new Date(data.effectiveTo)
            : undefined,
        },
        include: { major: true },
      });
      return new CurriculumResponseDto(updated);
    } catch (error) {
      console.error("Error updating curriculum:", error);
      throw new InternalServerErrorException(
        "Lỗi khi cập nhật chương trình khung",
      );
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.curriculum.delete({ where: { id } });
  }
}
