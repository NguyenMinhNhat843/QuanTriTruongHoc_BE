import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class EvaluationExportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy chi tiết phiếu điểm rèn luyện kèm theo các tiêu chí đã chấm
   * @param assessmentId ID của phiếu điểm rèn luyện (Assessment)
   */
  async getAssessmentDetails(assessmentId: number) {
    // 1. Tìm kiếm và kiểm tra sự tồn tại của phiếu điểm rèn luyện
    const assessment = await this.prisma.assessment.findUnique({
      where: {
        id: assessmentId, // Viết gọn là: id: Number(assessmentId) nếu lấy từ query/param string
      },
      include: {
        student: {
          select: {
            studentCode: true,
            fullName: true,
            class: {
              select: {
                className: true,
                classCode: true,
              },
            },
          },
        },
        period: {
          select: {
            name: true,
          },
        },
        details: {
          include: {
            periodCriterion: {
              include: {
                criterion: {
                  select: {
                    title: true,
                    maxScore: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // 2. Trả về lỗi rõ ràng nếu không tìm thấy phiếu điểm
    if (!assessment) {
      throw new NotFoundException(
        `Không tìm thấy phiếu điểm rèn luyện với ID: ${assessmentId}`,
      );
    }

    return assessment;
  }
}
