import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateCurriculumSubjectDto,
  UpdateCurriculumSubjectDto,
} from "./curriculumnSubject.dto";
import { CurriculumSubjectResponseDto } from "./curriculumnSubject.response";

@Injectable()
export class CurriculumSubjectService {
  constructor(private prisma: PrismaService) {}

  async create(
    data: CreateCurriculumSubjectDto,
  ): Promise<CurriculumSubjectResponseDto> {
    const { curriculumId, subjectId } = data;

    // 1. Kiểm tra Chương trình khung có tồn tại không
    const curriculum = await this.prisma.curriculum.findUnique({
      where: { id: curriculumId },
    });
    if (!curriculum)
      throw new NotFoundException(
        `Không tìm thấy chương trình khung ID ${curriculumId}`,
      );

    // 2. Kiểm tra Môn học có tồn tại không
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
    });
    if (!subject)
      throw new NotFoundException(`Không tìm thấy môn học ID ${subjectId}`);

    // 3. Kiểm tra môn học đã có trong chương trình này chưa (Tránh lỗi Unique Constraint)
    const existing = await this.prisma.curriculumSubject.findUnique({
      where: {
        curriculumId_subjectId: { curriculumId, subjectId },
      },
    });
    if (existing) {
      throw new ConflictException(
        "Môn học này đã tồn tại trong chương trình khung",
      );
    }

    try {
      const result = await this.prisma.curriculumSubject.create({
        data,
        include: { subject: true }, // Thường trả về kèm thông tin môn học
      });
      return new CurriculumSubjectResponseDto(result);
    } catch (error) {
      console.log("Lỗi khi tạo CurriculumSubject:", error);
      throw new InternalServerErrorException(
        "Lỗi khi thêm môn học vào chương trình",
      );
    }
  }

  async findByCurriculum(
    curriculumId: number,
  ): Promise<CurriculumSubjectResponseDto[]> {
    const list = await this.prisma.curriculumSubject.findMany({
      where: { curriculumId },
      include: { subject: true },
      orderBy: { semesterNumber: "asc" }, // Sắp xếp theo học kỳ gợi ý
    });
    return list.map((item) => new CurriculumSubjectResponseDto(item));
  }

  async update(
    id: number,
    data: UpdateCurriculumSubjectDto,
  ): Promise<CurriculumSubjectResponseDto> {
    const existing = await this.prisma.curriculumSubject.findUnique({
      where: { id },
    });
    if (!existing)
      throw new NotFoundException(
        "Không tìm thấy bản ghi môn học - chương trình",
      );

    try {
      const updated = await this.prisma.curriculumSubject.update({
        where: { id },
        data,
        include: { subject: true },
      });
      return new CurriculumSubjectResponseDto(updated);
    } catch (error) {
      console.log("Lỗi khi cập nhật CurriculumSubject:", error);
      throw new InternalServerErrorException(
        "Lỗi khi cập nhật môn học trong chương trình",
      );
    }
  }

  async remove(id: number) {
    const existing = await this.prisma.curriculumSubject.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException("Bản ghi không tồn tại");

    return this.prisma.curriculumSubject.delete({ where: { id } });
  }
}
