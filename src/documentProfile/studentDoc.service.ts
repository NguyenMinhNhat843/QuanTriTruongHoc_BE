import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import {
  CreateManyStudentDocumentDto,
  CreateStudentDocumentDto,
  SearchStudentDocDto,
  StudentDocumentResponseDto,
  UpdateStudentDocumentDto,
} from "./studentDoc.dto";
import { PrismaService } from "../prisma/prisma.service";
import { CloudinaryService } from "../cloundinary/cloundinary.service";

@Injectable()
export class StudentDocumentService {
  constructor(
    private readonly prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) {}

  private readonly commonInclude = {
    student: true,
    documentConfigItem: true,
  };

  async create(
    dto: CreateStudentDocumentDto,
    file: Express.Multer.File,
  ): Promise<StudentDocumentResponseDto> {
    // upload file
    const result = await this.cloudinaryService.uploadFile(
      file,
      "quantritruonghoc/student-documents",
    );

    const newDoc = await this.prisma.studentDocument.create({
      data: {
        fileName: file.originalname,
        fileSize: file.size,
        fileUrl: result.fileUrl,
        documentConfigItemId: dto.documentConfigItemId,
        studentId: dto.studentId,
      },
      include: this.commonInclude,
    });

    return plainToInstance(StudentDocumentResponseDto, newDoc);
  }

  async createMany(
    dto: CreateManyStudentDocumentDto,
    files: Express.Multer.File[],
  ) {
    const { studentId, documentConfigItemIds } = dto;

    // 1. Kiểm tra tính hợp lệ về số lượng file và số lượng ID danh mục truyền lên
    if (files.length !== documentConfigItemIds.length) {
      throw new BadRequestException(
        "Số lượng tệp tin và danh mục cấu hình tài liệu không khớp nhau",
      );
    }

    // Upload ảnh lên cloundinary
    const uploadedFiles = await Promise.all(
      files.map((file) =>
        this.cloudinaryService.uploadFile(
          file,
          "quantritruonghoc/student-documents",
        ),
      ),
    );

    // Map file với documentIds
    const dataToInsert = files.map((file, index) => {
      return {
        studentId: studentId,
        documentConfigItemId: Number(documentConfigItemIds[index]),
        fileName: file.originalname,
        fileSize: file.size,
        fileUrl: uploadedFiles[index].fileUrl,
      };
    });

    await this.prisma.studentDocument.createMany({
      data: dataToInsert,
      skipDuplicates: true,
    });

    return {
      message: `Upload thành công`,
    };
  }

  async findAll(
    searchDto?: SearchStudentDocDto,
  ): Promise<StudentDocumentResponseDto[]> {
    const docs = await this.prisma.studentDocument.findMany({
      where: searchDto,
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
