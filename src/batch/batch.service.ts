import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service"; // Đảm bảo đường dẫn đúng tới PrismaService
import { CreateBatchDto, SearchBatchDto, UpdateBatchDto } from "./batch.dto";
import { BatchResponseDto } from "./batch.response";
import { CurriculumService } from "../curriculumn/curriculum.service";
import { SemesterResponseDto } from "../semester/semester.response";
import { plainToInstance } from "class-transformer";
import { CurriculumSubjectResponseDto } from "../curriculumSubject/curriculumnSubject.response";

@Injectable()
export class BatchService {
  constructor(
    private prisma: PrismaService,
    private curriculumService: CurriculumService,
  ) {}

  /**
   * Tạo batch
   */
  async create(createBatchDto: CreateBatchDto) {
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

    /* eslint-disable @typescript-eslint/no-unused-vars */
    const { id, majorId, curriculumId, ...rest } = createBatchDto;

    // Thời gian kết thúc của 1 khóa đào tạo phụ thuộc vào chương trình khung của nó có mấy kỳ
    // Vis duj: start - 2026, gắn với chương trình có 3 kỳ thì end Year sẽ là 2027 (HK1 - 2027)
    const soKyTheoChuongTrinhKhung =
      await this.prisma.curriculumSubject.aggregate({
        where: {
          id: curriculumId,
        },
        _max: {
          semesterNumber: true,
        },
      });
    const time = (soKyTheoChuongTrinhKhung?._max.semesterNumber || 0) - 2;

    const endYear = rest.startYear + time / 2 + (time % 2 === 1 ? 1 : 0);

    return this.prisma.batch.create({
      data: {
        ...rest,
        endYear,
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
  async getBatchYears(batchId: number, batchData?: BatchResponseDto) {
    const batch = batchId
      ? await this.prisma.batch.findUnique({
          where: {
            id: batchId,
          },
          include: {
            curriculum: true,
          },
        })
      : batchData;

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
    const { term, year } = semester || {};
    if (!year || !term || !batchStartYear) {
      throw new BadRequestException("Thiếu thông tin học kỳ hoặc khóa đào tạo");
    }
    const semesterNo = (year - batchStartYear!) * 2 + (term === 1 ? 1 : 2);

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

    return plainToInstance(CurriculumSubjectResponseDto, subjects);
  }

  /**
   * Lấy thông tin hiển thị cho màn hình bảng Tiến độ đào tạo
   * Gồm thông tin môn học của 1 batch tại 1 học kỳ, thông tin giáo viên giảng dạy cho môn đó
   * Thông tin phòng học, giờ học, và các tuần trong kỳ
   */
  async getBatchSubjectsBySemesterId(batchId: number, semesterId: number) {
    const semester = await this.prisma.semester.findUnique({
      where: {
        id: semesterId,
      },
    });

    return await this.getBatchSubjectsBySemester(
      batchId,
      semester as SemesterResponseDto,
    );
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

    return plainToInstance(BatchResponseDto, data);
  }

  /**
   * Cập nhật khóa đào tạo
   */
  async update(id: number, updateBatchDto: UpdateBatchDto) {
    const existingBatch = await this.prisma.batch.findUnique({
      where: { id },
    });

    if (!existingBatch) {
      throw new NotFoundException(`Không tìm thấy khóa đào tạo với ID #${id}`);
    }

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

  /**
   * Lấy chi tiết 1 khóa
   */
  async findOne(id: number) {
    const batch = await this.prisma.batch.findUnique({
      where: { id },
      include: {
        classes: true,
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
