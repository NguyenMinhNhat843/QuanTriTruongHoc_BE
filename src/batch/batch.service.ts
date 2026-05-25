import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service"; // Đảm bảo đường dẫn đúng tới PrismaService
import { CreateBatchDto, SearchBatchDto, UpdateBatchDto } from "./batch.dto";
import { BatchResponseDto } from "./batch.response";
import { CurriculumService } from "../curriculumn/curriculum.service";
import { SemesterService } from "../semester/semester.service";
import { SemesterResponseDto } from "../semester/semester.response";

@Injectable()
export class BatchService {
  constructor(
    private prisma: PrismaService,
    private curriculumService: CurriculumService,

    @Inject(forwardRef(() => SemesterService))
    private semesterService: SemesterService,
  ) {}

  // 1. TẠO MỚI KHÓA ĐÀO TẠO
  async create(createBatchDto: CreateBatchDto) {
    // Kiểm tra logic năm học
    if (createBatchDto.endYear < createBatchDto.startYear) {
      throw new BadRequestException(
        "Năm kết thúc phải lớn hơn hoặc bằng năm bắt đầu",
      );
    }

    const existing = await this.prisma.batch.findUnique({
      where: { batchCode: createBatchDto.batchCode },
    });

    if (existing) {
      throw new BadRequestException("batchCode đã tồn tại");
    }

    const { majorId, curriculumId, ...rest } = createBatchDto;

    return this.prisma.batch.create({
      data: {
        ...rest,
        ...(curriculumId && {
          curriculum: {
            connect: { id: curriculumId },
          },
        }),
        major: {
          connect: { id: majorId },
        },
      },
    });
  }

  /**
   * Lấy danh sách batch còn hiệu lực tại học kỳ truyền vào
   */
  async findActiveBatchesBySemester(semester: SemesterResponseDto) {
    const { term, year } = semester;
    const batches = await this.prisma.batch.findMany();

    const batchStatuses = await Promise.all(
      batches.map(async (batch) => ({
        batch,
        timeline: await this.getBatchYears(batch.id),
      })),
    );

    return batchStatuses
      .filter(({ timeline: t }) => {
        if (!t) return false;
        if (year! < t.semesterYearStart || year! > t.semesterYearEnd)
          return false;

        if (year === t.semesterYearStart && term! < t.semesterTermStart)
          return false;
        if (year === t.semesterYearEnd && term! > t.semesterTermEnd)
          return false;

        return true;
      })
      .map((b) => b.batch);
  }

  /**
   * Lấy kỳ bắt đầu và kết thúc của 1 khóa đào tạo
   */
  async getBatchYears(batchId: number) {
    const batch = await this.prisma.batch.findUnique({
      where: {
        id: batchId,
      },
      include: {
        curriculum: true,
      },
    });

    if (!batch || !batch.curriculumId) return null;

    const semesterTermStart = 1;
    const semesterYearStart = batch?.startYear;
    const { maxSemesterNumber } =
      await this.curriculumService.analystCurriculum(batch!.curriculumId!);
    const semesterTermEnd = maxSemesterNumber % 2 === 0 ? 2 : 1;
    const semesterYearEnd =
      semesterYearStart + Math.floor((maxSemesterNumber - 1) / 2);
    return {
      semesterTermStart,
      semesterYearStart,
      semesterTermEnd,
      semesterYearEnd,
    };
  }

  /**
   * Lấy danh sách môn học của batch tại semester
   */
  async getBatchSubjectsBySemester(
    batchId: number,
    semester: SemesterResponseDto,
  ) {
    const batch = await this.prisma.batch.findUnique({
      where: {
        id: batchId,
      },
    });

    const batchStartYear = batch?.startYear;
    const { term, year } = semester;
    const semesterNo = (year - batchStartYear!) * 2 + (term === 1 ? 1 : 2);
    console.log("batchStartYear: ", batchStartYear);
    console.log("semesterNo: ", semesterNo);

    const curriculum = await this.prisma.curriculum.findFirst({
      where: {
        batches: {
          some: {
            id: batchId,
          },
        },
      },
    });

    const subjects = await this.prisma.curriculumSubject.findMany({
      where: {
        curriculumId: curriculum?.id,
        semesterNumber: semesterNo,
      },
      include: {
        subject: true,
      },
    });

    return subjects;
  }

  /**
   * Search Khóa đào tạo
   */
  async findAll(query: SearchBatchDto): Promise<BatchResponseDto[]> {
    const { majorId, majorCode } = query;

    const data = await this.prisma.batch.findMany({
      where: {
        ...(majorId ? { majorId: Number(majorId) } : {}),
        ...(majorCode
          ? {
              major: {
                majorCode: {
                  contains: majorCode,
                  mode: "insensitive", // Tìm kiếm không phân biệt chữ hoa / chữ thường
                },
              },
            }
          : {}),
      },
      include: {
        major: true,
      },
      orderBy: {
        startYear: "desc",
      },
    });

    return data.map((item) => new BatchResponseDto(item));
  }

  // 3. CẬP NHẬT THÔNG TIN KHÓA
  async update(id: number, updateBatchDto: UpdateBatchDto) {
    // Kiểm tra xem khóa có tồn tại không trước khi update
    const existingBatch = await this.prisma.batch.findUnique({
      where: { id },
    });

    if (!existingBatch) {
      throw new NotFoundException(`Không tìm thấy khóa đào tạo với ID #${id}`);
    }

    // Nếu cập nhật năm, kiểm tra lại logic năm học
    const startYear = updateBatchDto.startYear ?? existingBatch.startYear;
    const endYear = updateBatchDto.endYear ?? existingBatch.endYear;

    if (endYear < startYear) {
      throw new BadRequestException(
        "Năm kết thúc phải lớn hơn hoặc bằng năm bắt đầu",
      );
    }

    return await this.prisma.batch.update({
      where: { id },
      data: updateBatchDto,
    });
  }

  // 4. LẤY CHI TIẾT 1 KHÓA (Bổ sung để dễ quản lý)
  async findOne(id: number) {
    const batch = await this.prisma.batch.findUnique({
      where: { id },
      include: {
        classes: true, // Để xem khóa này có những lớp nào
      },
    });

    if (!batch) {
      throw new NotFoundException(`Không tìm thấy khóa đào tạo với ID #${id}`);
    }
    return batch;
  }

  async deleteBatchById(id: number) {
    return await this.prisma.batch.delete({
      where: { id },
    });
  }
}
