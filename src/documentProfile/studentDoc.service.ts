import { Injectable, NotFoundException } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import {
  CreateStudentDocumentDto,
  StudentDocumentResponseDto,
  UpdateStudentDocumentDto,
} from "./studentDoc.dto";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class StudentDocumentService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly commonInclude = {
    student: true,
    documentConfigItem: true,
  };

  async create(
    dto: CreateStudentDocumentDto,
  ): Promise<StudentDocumentResponseDto> {
    const newDoc = await this.prisma.studentDocument.create({
      data: dto,
      include: this.commonInclude,
    });

    return plainToInstance(StudentDocumentResponseDto, newDoc);
  }

  async findAll(): Promise<StudentDocumentResponseDto[]> {
    const docs = await this.prisma.studentDocument.findMany({
      include: this.commonInclude,
    });

    return plainToInstance(StudentDocumentResponseDto, docs);
  }

  async findOne(id: number): Promise<StudentDocumentResponseDto> {
    const doc = await this.prisma.studentDocument.findUnique({
      where: { id },
      include: this.commonInclude,
    });

    if (!doc) {
      throw new NotFoundException(`StudentDocument với ID ${id} không tồn tại`);
    }

    return plainToInstance(StudentDocumentResponseDto, doc);
  }

  async update(
    id: number,
    dto: UpdateStudentDocumentDto,
  ): Promise<StudentDocumentResponseDto> {
    await this.findOne(id);

    const updatedDoc = await this.prisma.studentDocument.update({
      where: { id },
      data: dto,
      include: this.commonInclude,
    });

    return plainToInstance(StudentDocumentResponseDto, updatedDoc);
  }

  async remove(id: number): Promise<{ message: string }> {
    await this.findOne(id);

    await this.prisma.studentDocument.delete({
      where: { id },
    });

    return { message: `Xóa thành công StudentDocument với ID ${id}` };
  }
}
