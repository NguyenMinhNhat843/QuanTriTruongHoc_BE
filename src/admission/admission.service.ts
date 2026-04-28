import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAdmissionDto } from "./admission.dto";
import { AdmissionStatus } from "../../prisma/generated/prisma/enums";

@Injectable()
export class AdmissionService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateAdmissionDto) {
    const { name, startDate, endDate, items } = data;

    // Sử dụng $transaction để đảm bảo tính toàn vẹn dữ liệu
    return await this.prisma.$transaction(async (tx) => {
      // 1. Tạo đợt tuyển sinh tổng thể
      const admission = await tx.admission.create({
        data: {
          name,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          status: AdmissionStatus.OPEN,
        },
      });

      // 2. Xử lý từng ngành tuyển sinh (AdmissionItem)
      for (const item of items) {
        // Lấy thông tin ngành để biết khóa hiện tại (currentBatch)
        const major = await tx.major.findUnique({
          where: { id: item.majorId },
        });

        if (!major) {
          throw new NotFoundException(
            `Ngành với ID ${item.majorId} không tồn tại`,
          );
        }

        // 3. Tạo AdmissionItem
        const admissionItem = await tx.admissionItem.create({
          data: {
            admissionId: admission.id,
            majorId: item.majorId,
            batchName: item.batchName,
            quota: item.quota,
          },
        });

        // 4. Nếu có tiêu chí đi kèm, tạo các AdmissionCriterion
        if (item.criteria && item.criteria.length > 0) {
          await tx.admissionCriterion.createMany({
            data: item.criteria.map((criterion) => ({
              admissionItemId: admissionItem.id,
              criterionName: criterion.criterionName,
              minValue: criterion.minValue,
              isRequired: criterion.isRequired,
              description: criterion.description,
            })),
          });
        }
      }

      return tx.admission.findUnique({
        where: { id: admission.id },
        include: {
          items: {
            include: {
              criteria: true,
              major: true,
            },
          },
        },
      });
    });
  }

  // Hàm lấy danh sách để bạn kiểm tra kết quả
  async findAll() {
    return await this.prisma.admission.findMany({
      include: {
        items: {
          include: {
            criteria: true,
            major: true,
          },
        },
      },
      orderBy: { startDate: "desc" },
    });
  }
}
