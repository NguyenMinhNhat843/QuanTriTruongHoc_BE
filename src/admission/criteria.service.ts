import { Injectable, ConflictException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service"; // Giả định bạn đã có PrismaService
import { CriterionResponseDto } from "./admission.response";
import { CreateCriterionDto } from "./admission.dto";
import { DeleteCriterionDto } from "./criteria.dto";

@Injectable()
export class CriterionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCriterionDto): Promise<CriterionResponseDto> {
    // Kiểm tra trùng tên tiêu chí (nếu cần thiết cho nghiệp vụ của bạn)
    const existing = await this.prisma.criterion.findFirst({
      where: { criterionName: data.criterionName },
    });

    if (existing) {
      throw new ConflictException("Tên tiêu chí này đã tồn tại trong hệ thống");
    }

    const newCriterion = await this.prisma.criterion.create({
      data: {
        criterionName: data.criterionName,
        type: data.type,
        description: data.description,
      },
    });

    // Trả về instance của DTO để đảm bảo các decorator @Expose hoạt động
    return new CriterionResponseDto(newCriterion);
  }

  async findAll(): Promise<CriterionResponseDto[]> {
    const result = await this.prisma.criterion.findMany();
    return result.map((criterion) => new CriterionResponseDto(criterion));
  }

  async deleteCriteria(data: DeleteCriterionDto): Promise<void> {
    await this.prisma.criterion.delete({
      where: { id: data.id },
    });
  }
}
