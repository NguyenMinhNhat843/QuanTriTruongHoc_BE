import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SubjectResponseDto } from "./subject.response";
import { CreateSubjectDto, UpdateSubjectDto } from "./subject.dto";

@Injectable()
export class SubjectService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateSubjectDto): Promise<SubjectResponseDto> {
    const { subjectCode } = data;

    // 2. Kiểm tra trùng mã môn học
    const existingSubject = await this.prisma.subject.findUnique({
      where: { subjectCode },
    });
    if (existingSubject) {
      throw new ConflictException(`Mã môn học ${subjectCode} đã tồn tại`);
    }

    try {
      const subject = await this.prisma.subject.create({
        data,
      });
      return new SubjectResponseDto(subject);
    } catch (error) {
      console.log("Lỗi tạo môn học:", error);
      throw new InternalServerErrorException("Lỗi hệ thống khi tạo môn học");
    }
  }

  async findAll(): Promise<SubjectResponseDto[]> {
    const subjects = await this.prisma.subject.findMany({
      include: {
        _count: { select: { curriculumnSubject: true, courseOffers: true } },
      },
    });
    return subjects.map((item) => new SubjectResponseDto(item));
  }

  async findOne(id: number): Promise<SubjectResponseDto> {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: {
        _count: { select: { curriculumnSubject: true, courseOffers: true } },
      },
    });

    if (!subject) {
      throw new NotFoundException(`Không tìm thấy môn học với ID ${id}`);
    }
    return new SubjectResponseDto(subject);
  }

  async update(
    id: number,
    data: UpdateSubjectDto,
  ): Promise<SubjectResponseDto> {
    // Kiểm tra môn học tồn tại
    await this.findOne(id);

    try {
      const updated = await this.prisma.subject.update({
        where: { id },
        data,
      });
      return new SubjectResponseDto(updated);
    } catch (error) {
      console.log("Lỗi cập nhật môn học:", error);
      throw new InternalServerErrorException("Lỗi khi cập nhật môn học");
    }
  }

  async remove(id: number) {
    const subject = await this.findOne(id);
    return this.prisma.subject.delete({ where: { id: subject.id } });
  }
}
