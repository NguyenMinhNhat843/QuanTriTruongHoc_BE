import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAdmissionDto } from "./admission.dto";

@Injectable()
export class AdmissionService {
  constructor(private prisma: PrismaService) {}

  async create(createAdmissionDto: CreateAdmissionDto) {
    const { items, ...admissionData } = createAdmissionDto;

    // Kiểm tra logic: ngày kết thúc phải sau ngày bắt đầu
    if (new Date(admissionData.endDate) <= new Date(admissionData.startDate)) {
      throw new BadRequestException("Ngày kết thúc phải sau ngày bắt đầu.");
    }

    try {
      // Sử dụng $transaction để đảm bảo tạo đợt tuyển sinh và các item cùng lúc
      return await this.prisma.$transaction(async (tx) => {
        // 1. Tạo Đợt tuyển sinh tổng thể (Admission)
        const admission = await tx.admission.create({
          data: {
            ...admissionData,
            // 2. Tạo các Chi tiết tuyển sinh (AdmissionItem)
            items: {
              create: items.map((item) => ({
                majorId: item.majorId,
                batchName: item.batchName,
                quota: item.quota,
                // 3. Tạo các Tiêu chí cho từng ngành (AdmissionItemCriterion)
                criteria: {
                  create: item.criteria.map((criterion) => ({
                    criterionId: criterion.criterionId,
                    minValue: criterion.minValue,
                    isRequired: criterion.isRequired,
                    weight: criterion.weight,
                  })),
                },
              })),
            },
          },
          // Bao gồm các quan hệ trong kết quả trả về để kiểm tra
          include: {
            items: {
              include: {
                criteria: true,
              },
            },
          },
        });

        return admission;
      });
    } catch (error) {
      console.log("Lỗi khi tạo đợt tuyển sinh:", error);
      // Xử lý lỗi Prisma (ví dụ: sai ID ngành, sai ID tiêu chí mẫu)
      throw new BadRequestException(
        "Không thể tạo đợt tuyển sinh. Vui lòng kiểm tra lại dữ liệu đầu vào.",
      );
    }
  }

  // Hàm lấy danh sách để bạn kiểm tra kết quả
  async findAll() {
    return await this.prisma.admission.findMany({
      include: {
        // Đếm số lượng ngành trong mỗi đợt (tùy chọn)
        _count: {
          select: { items: true },
        },
      },
      orderBy: {
        startDate: "desc", // Đợt mới nhất hiện lên đầu
      },
    });
  }

  async findOne(id: number) {
    const admission = await this.prisma.admission.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            // Lấy thông tin ngành học (Tên ngành, mã ngành)
            major: true,
            // Lấy danh sách tiêu chí của ngành này
            criteria: {
              include: {
                // Quan trọng: Lấy thông tin từ bảng tiêu chí mẫu (Criterion)
                criterion: {
                  select: {
                    criterionName: true,
                    type: true,
                    description: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!admission) {
      throw new NotFoundException(`Không tìm thấy đợt tuyển sinh với ID ${id}`);
    }

    return admission;
  }
}
