import { Injectable, NotFoundException } from "@nestjs/common";
import {
  CreateTeachingQuotaDto,
  SearchTeachingQuotaDto,
  TeachingQuotaPaginationResponseDto,
  UpdateTeachingQuotaDto,
} from "../dto/teaching-quota.dto";
import { PrismaService } from "../../prisma/prisma.service";
import { Prisma } from "../../../prisma/generated/prisma/client";

@Injectable()
export class TeachingQuotaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTeachingQuotaDto) {
    return this.prisma.teachingQuota.create({
      data: dto,
    });
  }

  /**
   * Tính toán và cập nhật actualHours cho 1 giáo viên trong 1 năm học cụ thể
   */
  async syncTeacherActualHours(staffId: number, academicYearId: number): Promise<number> {
    const taughtSchedules = await this.prisma.classSubjectScheduleDetail.findMany({
      where: {
        attendances: {
          some: {},
        },
        session: {
          classSubject: {
            teacherId: staffId,
            semester: {
              year: academicYearId,
            },
          },
        },
      },
      select: {
        id: true,
        session: {
          select: {
            countPeriod: true,
            startPeriod: true,
            endPeriod: true,
          },
        },
      },
    });

    const totalActualHours = taughtSchedules.reduce((sum, schedule) => {
      const session = schedule.session;
      const periods = session.countPeriod ?? session.endPeriod - session.startPeriod + 1;
      return sum + periods;
    }, 0);

    const quota = await this.prisma.teachingQuota.findFirst({
      where: {
        staffId,
        teachingLevel: {
          academicYearId,
        },
      },
    });

    if (!quota) {
      throw new NotFoundException(
        `Không tìm thấy Định mức giảng dạy (TeachingQuota) cho Giáo viên ID ${staffId} trong Năm học ID ${academicYearId}.`,
      );
    }

    await this.prisma.teachingQuota.update({
      where: { id: quota.id },
      data: {
        actualHours: totalActualHours,
      },
    });

    return totalActualHours;
  }

  /**
   * Đồng bộ lại số tiết giảng dạy cho TOÀN BỘ giáo viên trong 1 năm học
   * Thích hợp chạy định kỳ (Cronjob) hoặc Trigger sau khi kết thúc học kỳ
   */
  async syncAllTeachersActualHours(academicYearId: number) {
    // Lấy tất cả định mức trong năm học đó
    const quotas = await this.prisma.teachingQuota.findMany({
      where: {
        teachingLevel: {
          academicYearId,
        },
      },
      select: {
        staffId: true,
      },
    });

    const results: any = [];
    for (const { staffId } of quotas) {
      try {
        const hours = await this.syncTeacherActualHours(staffId, academicYearId);
        results.push({ staffId, status: "SUCCESS", actualHours: hours });
      } catch (error: any) {
        results.push({ staffId, status: "FAILED", reason: error.message });
      }
    }

    return results;
  }

  async findAll(query: SearchTeachingQuotaDto): Promise<TeachingQuotaPaginationResponseDto> {
    const { page = 1, limit = 10, staffId, teachingLevelId, academicYearId } = query;
    const skip = (page - 1) * limit;

    // Khởi tạo điều kiện truy vấn Prisma
    const where: Prisma.TeachingQuotaWhereInput = {};

    if (staffId) {
      where.staffId = Number(staffId);
    }

    if (teachingLevelId) {
      where.teachingLevelId = Number(teachingLevelId);
    }

    // Lọc theo năm học thông qua bảng TeachingLevel
    if (academicYearId) {
      where.teachingLevel = {
        academicYearId: Number(academicYearId),
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.teachingQuota.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          teachingLevel: {
            include: {
              academicYear: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.teachingQuota.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(id: number) {
    const item = await this.prisma.teachingQuota.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException(`Không tìm thấy TeachingQuota với ID: ${id}`);
    }

    return item;
  }

  async update(id: number, dto: UpdateTeachingQuotaDto) {
    await this.findOne(id);

    return this.prisma.teachingQuota.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.teachingQuota.delete({
      where: { id },
    });
  }
}
