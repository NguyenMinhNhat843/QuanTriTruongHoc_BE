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
import { GradeSubjectService } from "../grade/gradeSubject.service";

@Injectable()
export class SubjectService {
  constructor(
    private prisma: PrismaService,
    private gradeSubjectService: GradeSubjectService,
  ) {}

  async create(data: CreateSubjectDto): Promise<SubjectResponseDto> {
    const { subjectCode, gradeComponents, ...subjectData } = data;

    // 1. Kiểm tra trùng mã môn học trước khi mở transaction (Tránh giữ lock DB lâu không cần thiết)
    const existingSubject = await this.prisma.subject.findUnique({
      where: { subjectCode },
    });
    if (existingSubject) {
      throw new ConflictException(`Mã môn học ${subjectCode} đã tồn tại`);
    }

    // 2. Kiểm tra mảng cấu hình điểm truyền lên không được rỗng
    if (!gradeComponents || gradeComponents.length === 0) {
      throw new BadRequestException(
        "Môn học phải cấu hình ít nhất một cột điểm thành phần với trọng số kèm theo",
      );
    }

    try {
      // 3. Sử dụng $transaction để đảm bảo đồng thời tạo môn học và tạo trọng số điểm thành công
      const newSubject = await this.prisma.$transaction(async (tx) => {
        // 3.1 Tạo thông tin cơ bản cho môn học (Đã loại bỏ trường grade_components dạng chuỗi cũ)
        const subject = await tx.subject.create({
          data: {
            ...subjectData,
            subjectCode,
          },
        });

        // 3.2 Gọi hàm xử lý cấu hình điểm thành phần của bạn, truyền tx vào để chạy chung luồng
        // Hàm này sẽ tự động chạy kiểm tra tổng weight xem có bằng 1.0 (100%) hay không
        await this.gradeSubjectService.createSubjectWeights(
          {
            subjectId: subject.id,
            gradeComponents: gradeComponents,
          },
          tx, // KHÓA MẤU CHỐT: Ép hàm createSubjectWeights chạy chung transaction
        );

        return subject;
      });

      return plainToInstance(SubjectResponseDto, newSubject);
    } catch (error) {
      // Nếu lỗi sinh ra do các BadRequestException ở tầng kiểm tra trọng số của hàm createSubjectWeights phát ra
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
    // Sử dụng include để lấy luôn thông tin bảng trung gian và bảng loại điểm hệ thống
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: {
        subjectGrades: {
          include: {
            gradeComponent: true, // Lấy tên và thông tin chi tiết của loại điểm (Chuyên cần, Giữa kỳ...)
          },
        },
      },
    });

    if (!subject) {
      throw new NotFoundException(`Không tìm thấy môn học với ID ${id}`);
    }

    // Chuyển đổi dữ liệu sang DTO Response sạch sẽ
    return plainToInstance(SubjectResponseDto, subject);
  }

  /**
   * Update môn học
   */
  async update(
    id: number,
    data: UpdateSubjectDto,
  ): Promise<SubjectResponseDto> {
    const { subjectCode, gradeComponents, ...subjectData } = data;
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

    try {
      // 3. Sử dụng $transaction để đảm bảo cập nhật thông tin môn học và điểm thành phần diễn ra nguyên tử
      const updatedSubject = await this.prisma.$transaction(async (tx) => {
        // 3.1 Nếu người dùng có truyền mảng cấu hình điểm thành phần lên thì mới xử lý
        if (gradeComponents) {
          // Kiểm tra mảng cấu hình truyền lên không được rỗng
          if (gradeComponents.length === 0) {
            throw new BadRequestException(
              "Môn học phải cấu hình ít nhất một cột điểm thành phần với trọng số kèm theo",
            );
          }

          // Gọi hàm tạo/ghi đè cấu hình điểm thành phần, truyền tx vào chạy chung transaction
          // Hàm này sẽ tự động chạy logic kiểm tra tổng weight xem có bằng 1.0 (100%) hay không
          await this.gradeSubjectService.createSubjectWeights(
            {
              subjectId: id,
              gradeComponents: gradeComponents,
            },
            tx, // Ép hàm createSubjectWeights chạy chung transaction để có thể rollback khi lỗi
          );
        }

        // 3.2 Cập nhật các thông tin cơ bản của môn học vào database
        return tx.subject.update({
          where: { id },
          data: updateData,
        });
      });

      return plainToInstance(SubjectResponseDto, updatedSubject);
    } catch (error) {
      // Bắn ngược lại các lỗi validate logic (như lỗi tổng trọng số không bằng 1.0) từ hàm createSubjectWeights ra ngoài
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
