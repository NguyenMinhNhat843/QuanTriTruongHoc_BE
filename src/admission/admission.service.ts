import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAdmissionDto } from "./admission.dto";

@Injectable()
export class AdmissionService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAdmissionDto) {
    // 1. Kiểm tra logic ngày tháng
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    if (end <= start) {
      throw new BadRequestException("Ngày kết thúc phải sau ngày bắt đầu");
    }

    try {
      // 2. Thực hiện Nested Write trong Prisma
      // Tự động tạo Admission và các AdmissionItem liên quan trong 1 Transaction
      return await this.prisma.admission.create({
        data: {
          name: dto.name,
          startDate: start,
          endDate: end,
          items: {
            create: dto.items.map((item) => ({
              batchId: item.batchId,
              quota: item.quota,
            })),
          },
        },
        // Bao gồm luôn các items trong kết quả trả về để Frontend kiểm tra
        include: {
          items: {
            include: {
              batch: {
                select: {
                  batchName: true,
                  batchCode: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      console.error("Lỗi khi tạo đợt tuyển sinh:", error);
      throw new InternalServerErrorException(
        "Đã xảy ra lỗi trong quá trình tạo đợt tuyển sinh.",
      );
    }
  }

  // Hàm lấy danh sách để bạn kiểm tra kết quả
  async findAll() {
    return await this.prisma.admission.findMany({
      include: {
        items: {
          include: {
            batch: {
              include: {
                major: true,
              },
            },
          },
        },
      },
      orderBy: { startDate: "desc" },
    });
  }
}
