import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SubjectResponseDto } from "./subject.response";
import { CreateSubjectDto, UpdateSubjectDto } from "./subject.dto";
import { plainToInstance } from "class-transformer";

@Injectable()
export class SubjectService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateSubjectDto): Promise<SubjectResponseDto> {
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

      return plainToInstance(SubjectResponseDto, newSubject);
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

  async findAll(): Promise<SubjectResponseDto[]> {
    const subjects = await this.prisma.subject.findMany();
    // Lấy danh sach cột điểm từ mảng grade_components
    return plainToInstance(SubjectResponseDto, subjects);
  }

  /**
   * Lấy chi tiết môn học theo id với cấu hình điểm
   */
  async findOne(id: number): Promise<SubjectResponseDto> {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
    });

    if (!subject) {
      throw new NotFoundException(`Không tìm thấy môn học với ID ${id}`);
    }

    return plainToInstance(SubjectResponseDto, subject);
  }

  /**
   * Update môn học
   */
  async update(
    id: number,
    data: UpdateSubjectDto,
  ): Promise<SubjectResponseDto> {
    const { subjectCode, ...subjectData } = data;
    const existingSubject = await this.prisma.subject.findUnique({
      where: { subjectCode },
    });
    if (existingSubject) {
      throw new ConflictException(`Mã môn học ${subjectCode} đã tồn tại`);
    }

    const updateData: any = { ...subjectData };

    if (subjectCode) {
      const existingSubject = await this.prisma.subject.findFirst({
        where: {
          subjectCode,
          id: { not: id },
        },
      });
      if (existingSubject) {
        throw new ConflictException(
          `Mã môn học ${subjectCode} đã tồn tại trên hệ thống`,
        );
      }
      updateData.subjectCode = subjectCode;
    }

    try {
      const updatedSubject = await this.prisma.$transaction(async (tx) => {
        return tx.subject.update({
          where: { id },
          data: updateData,
        });
      });

      return plainToInstance(SubjectResponseDto, updatedSubject);
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
