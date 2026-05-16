import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ResponseFindOneSubject, SubjectResponseDto } from "./subject.response";
import { CreateSubjectDto, UpdateSubjectDto } from "./subject.dto";
import { plainToInstance } from "class-transformer";

@Injectable()
export class SubjectService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateSubjectDto): Promise<SubjectResponseDto> {
    const { subjectCode, gradeComponentIds, ...subjectData } = data;

    // 2. Kiểm tra trùng mã môn học
    const existingSubject = await this.prisma.subject.findUnique({
      where: { subjectCode },
    });
    if (existingSubject) {
      throw new ConflictException(`Mã môn học ${subjectCode} đã tồn tại`);
    }

    // 3. Kiểm tra mảng ID truyền lên không được rỗng
    if (!gradeComponentIds || gradeComponentIds.length === 0) {
      throw new BadRequestException(
        "Môn học phải cấu hình ít nhất một cột điểm thành phần",
      );
    }

    // 4. Lấy danh sách GradeComponent từ database dựa theo các ID truyền lên
    const gradeComponents = await this.prisma.gradeComponent.findMany({
      where: {
        id: { in: gradeComponentIds },
      },
    });

    // Kiểm tra xem có ID nào không hợp lệ (không tìm thấy trong DB) không
    if (
      gradeComponents.length !== Array.from(new Set(gradeComponentIds)).length
    ) {
      throw new BadRequestException(
        "Một hoặc nhiều ID điểm thành phần không tồn tại trên hệ thống",
      );
    }

    // 5. Tính tổng trọng số (weight)
    // Sử dụng reduce để cộng dồn các trọng số
    const totalWeight = gradeComponents.reduce(
      (sum, comp) => sum + comp.weight,
      0,
    );

    // Kiểm tra tổng trọng số có bằng 1 hay không (Sử dụng Math.abs để tránh sai số dấu phẩy động)
    if (Math.abs(totalWeight - 1) > 0.00001) {
      throw new BadRequestException(
        `Tổng trọng số cấu hình các điểm phải bằng 1 (Hiện tại là: ${totalWeight * 100}%)`,
      );
    }

    // 6. Chuẩn bị chuỗi string dạng "1, 4, 7" từ mảng ID ban đầu để lưu vào DB
    const gradeComponentsString = gradeComponentIds.join(", ");

    try {
      // 7. Thực hiện tạo môn học với trường grade_components đã được map thành string [cite: 15]
      const subject = await this.prisma.subject.create({
        data: {
          ...subjectData,
          subjectCode,
          grade_components: gradeComponentsString, // Lưu chuỗi ID [cite: 15]
        },
      });

      return plainToInstance(SubjectResponseDto, subject);
    } catch (error) {
      console.log("Lỗi tạo môn học:", error);
      throw new InternalServerErrorException("Lỗi hệ thống khi tạo môn học");
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
  async findOne(id: number): Promise<ResponseFindOneSubject> {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
    });

    // Lấy danh sách cột điểm từ trường grade_components (chuỗi "1, 4, 7") và chuyển thành mảng [1, 4, 7]
    const gradeComponentIds = subject?.grade_components
      ? subject.grade_components
          .split(",")
          .map((idStr) => parseInt(idStr.trim()))
      : [];

    const gradeComponents = await this.prisma.gradeComponent.findMany({
      where: {
        id: { in: gradeComponentIds },
      },
    });

    if (!subject) {
      throw new NotFoundException(`Không tìm thấy môn học với ID ${id}`);
    }
    const response = plainToInstance(ResponseFindOneSubject, subject);
    response.gradeComponents = gradeComponents;
    return response;
  }

  /**
   * Update môn học
   */
  async update(
    id: number,
    data: UpdateSubjectDto,
  ): Promise<SubjectResponseDto> {
    // 1. Kiểm tra môn học có tồn tại hay không
    await this.findOne(id);

    // Bóc tách gradeComponentIds và subjectCode ra khỏi data để xử lý riêng
    const { gradeComponentIds, subjectCode, ...subjectData } = data;

    // Chuẩn bị object data để update vào Prisma
    const updateData: any = { ...subjectData };

    // 2. Nếu người dùng cập nhật mã môn học, kiểm tra trùng mã (trừ chính nó)
    if (subjectCode) {
      const existingSubject = await this.prisma.subject.findFirst({
        where: {
          subjectCode,
          id: { not: id }, // Bỏ qua bản ghi hiện tại
        },
      });
      if (existingSubject) {
        throw new ConflictException(
          `Mã môn học ${subjectCode} đã tồn tại trên hệ thống`,
        );
      }
      updateData.subjectCode = subjectCode;
    }

    // 3. Nếu người dùng có truyền mảng gradeComponentIds lên thì mới validate và xử lý
    if (gradeComponentIds) {
      // Kiểm tra mảng ID truyền lên không được rỗng
      if (gradeComponentIds.length === 0) {
        throw new BadRequestException(
          "Môn học phải cấu hình ít nhất một cột điểm thành phần",
        );
      }

      // Lấy danh sách GradeComponent từ database dựa theo các ID truyền lên
      const gradeComponents = await this.prisma.gradeComponent.findMany({
        where: {
          id: { in: gradeComponentIds },
        },
      });

      // Kiểm tra xem có ID nào không hợp lệ (không tìm thấy trong DB) không
      if (
        gradeComponents.length !== Array.from(new Set(gradeComponentIds)).length
      ) {
        throw new BadRequestException(
          "Một hoặc nhiều ID điểm thành phần không tồn tại trên hệ thống",
        );
      }

      // Tính tổng trọng số (weight) để đảm bảo bằng 1 (100%)
      const totalWeight = gradeComponents.reduce(
        (sum, comp) => sum + comp.weight,
        0,
      );

      if (Math.abs(totalWeight - 1) > 0.00001) {
        throw new BadRequestException(
          `Tổng trọng số cấu hình các điểm phải bằng 1 (Hiện tại là: ${totalWeight * 100}%)`,
        );
      }

      // Chuẩn bị chuỗi string dạng "1, 4, 7" từ mảng ID ban đầu để lưu vào DB
      const gradeComponentsString = gradeComponentIds.join(", ");
      updateData.grade_components = gradeComponentsString;
    }

    // 4. Tiến hành cập nhật vào database
    try {
      const updated = await this.prisma.subject.update({
        where: { id },
        data: updateData,
      });

      return plainToInstance(SubjectResponseDto, updated);
    } catch (error) {
      console.log("Lỗi cập nhật môn học:", error);
      throw new InternalServerErrorException(
        "Lỗi hệ thống khi cập nhật môn học",
      );
    }
  }

  async remove(id: number) {
    const subject = await this.findOne(id);
    return this.prisma.subject.delete({ where: { id: subject.id } });
  }
}
