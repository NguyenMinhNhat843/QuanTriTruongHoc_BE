import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import {
  CreateCriterionDto,
  CreatePeriodDto,
  LoadAssessmentDto,
  UpdateAssessmentDto,
  UpdateCriterionDto,
  UpdatePeriodDto,
} from "../assessment.dto";
import { plainToInstance } from "class-transformer";
import {
  CriterionDto,
  EvaluationPeriodDto,
  ResponseEvaluationPeriodDtoWithRelation,
} from "../assessment-response.dto";
import {
  AssessmentStatus,
  EvaluationGrade,
} from "../../../prisma/generated/prisma/enums";

@Injectable()
export class AssessmentService {
  constructor(private readonly prismaService: PrismaService) {}

  // Create Criteria: Tiêu chí chấm điểm
  async createCriteria(createCriterionDto: CreateCriterionDto) {
    const { title, maxScore, sortOrder } = createCriterionDto;
    const newCriterion = await this.prismaService.criterion.create({
      data: {
        title,
        maxScore,
        sortOrder,
      },
    });
    return newCriterion;
  }

  // Update Criteria: Cập nhật tiêu chí chấm điểm
  async updateCriteria(id: number, updateCriterionDto: UpdateCriterionDto) {
    const { title, maxScore, sortOrder } = updateCriterionDto;
    const updatedCriterion = await this.prismaService.criterion.update({
      where: { id },
      data: {
        title,
        maxScore,
        sortOrder,
      },
    });
    return updatedCriterion;
  }

  // Delete Criteria: Xóa tiêu chí chấm điểm
  async deleteCriteria(id: number) {
    const deletedCriterion = await this.prismaService.criterion.delete({
      where: { id },
    });
    return deletedCriterion;
  }

  // Lấy All tiêu chí chấm điểm
  async getAllCriteria() {
    const criteria = await this.prismaService.criterion.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return plainToInstance(CriterionDto, criteria);
  }

  // Create Period: Đợt đánh giá
  async createPeriod(createPeriodDto: CreatePeriodDto) {
    const { criterionIds, ...evaluationPeriodData } = createPeriodDto;

    const result = await this.prismaService.$transaction(async (tx) => {
      const newPeriod = await tx.evaluationPeriod.create({
        data: {
          ...evaluationPeriodData,
          isActive: true,
          isFrozen: false,
        },
      });

      if (criterionIds && criterionIds.length > 0) {
        const criteria = await tx.criterion.findMany({
          where: {
            id: { in: criterionIds },
          },
          select: {
            id: true,
            maxScore: true,
          },
        });

        const criteriaMap = new Map(criteria.map((c) => [c.id, c.maxScore]));

        await tx.evaluationPeriodCriterion.createMany({
          data: criterionIds.map((criterionId) => {
            const maxScore = criteriaMap.get(criterionId);

            const maxScoreSnapshot = maxScore !== undefined ? maxScore : 0;

            return {
              periodId: newPeriod.id,
              criterionId,
              maxScoreSnapshot,
            };
          }),
        });
      }

      return newPeriod;
    });

    return result;
  }

  // Update Period: Cập nhật đợt đánh giá
  async updatePeriod(id: number, updatePeriodDto: UpdatePeriodDto) {
    const { criterionIds, ...periodData } = updatePeriodDto;
    const result = await this.prismaService.$transaction(async (tx) => {
      const updatedPeriod = await tx.evaluationPeriod.update({
        where: { id },
        data: periodData,
      });

      if (criterionIds) {
        await tx.evaluationPeriodCriterion.deleteMany({
          where: { periodId: id },
        });

        await tx.evaluationPeriodCriterion.createMany({
          data: criterionIds.map((criterionId) => ({
            periodId: id,
            criterionId,
            maxScoreSnapshot: 0,
          })),
        });
      }

      return updatedPeriod;
    });

    return result;
  }

  // Delete Period: Xóa đợt đánh giá
  async deletePeriod(id: number) {
    const result = await this.prismaService.$transaction(async (tx) => {
      await tx.evaluationPeriodCriterion.deleteMany({
        where: { periodId: id },
      });

      const deletedPeriod = await tx.evaluationPeriod.delete({
        where: { id },
      });

      return deletedPeriod;
    });

    return result;
  }

  // Get All Periods: Lấy danh sách đợt đánh giá
  async getAllPeriods() {
    const periods = await this.prismaService.evaluationPeriod.findMany({
      orderBy: { createdAt: "desc" },
    });
    return plainToInstance(EvaluationPeriodDto, periods);
  }

  async getDetailPeriod(id: number) {
    const period = await this.prismaService.evaluationPeriod.findUnique({
      where: { id },
      include: {
        periodCriteria: {
          include: {
            criterion: true,
          },
        },
      },
    });

    if (!period) {
      throw new Error(`Đợt đánh giá với ID ${id} không tồn tại.`);
    }

    return plainToInstance(ResponseEvaluationPeriodDtoWithRelation, period);
  }

  /**
   * Lấy tóm tắt tình trạng phiếu điểm rèn luyện đợt hiện tại của sinh viên
   */
  async getEvaluationSummary(studentId: number) {
    // 1. Tìm đợt đánh giá điểm rèn luyện đang mở thuộc học kỳ hiện tại
    const currentPeriod = await this.prismaService.evaluationPeriod.findFirst({
      where: {
        isActive: true,
        semester: {
          isCurrent: true,
        },
      },
      select: {
        id: true,
        name: true,
        isFrozen: true,
      },
    });

    // Nếu không có đợt đánh giá nào đang mở, trả về trạng thái không hoạt động
    if (!currentPeriod) {
      return {
        hasActivePeriod: false,
        message:
          "Hiện tại không nằm trong đợt đánh giá hoặc đợt đánh giá đã đóng.",
        periodName: null,
        assessment: null,
      };
    }

    // 2. Tìm phiếu điểm của sinh viên trong đợt đánh giá này
    const assessment = await this.prismaService.assessment.findUnique({
      where: {
        studentId_periodId: {
          studentId: studentId,
          periodId: currentPeriod.id,
        },
      },
      select: {
        id: true,
        status: true,
        totalStudentScore: true,
        totalTeacherScore: true,
        finalGrade: true,
        teacherComment: true,
        updatedAt: true,
      },
    });

    // 3. Chuẩn hóa dữ liệu trả về dựa trên tình trạng phiếu điểm
    if (!assessment) {
      // Trường hợp hệ thống đã mở đợt nhưng sinh viên chưa hề ấn khởi tạo hay lưu nháp
      return {
        hasActivePeriod: true,
        periodName: currentPeriod.name,
        isFrozen: currentPeriod.isFrozen,
        assessment: {
          status: "NOT_CREATED", // FE dựa vào đây hiển thị nút "Bắt đầu chấm điểm"
          statusLabel: "Chưa tự chấm",
          totalStudentScore: 0,
          totalTeacherScore: 0,
          finalGrade: null,
          teacherComment: null,
          lastUpdatedAt: null,
        },
      };
    }

    // Định nghĩa label tiếng Việt cho các trạng thái Enum để FE dễ hiển thị dạng Tag/Badge
    const statusLabels: Record<string, string> = {
      NOT_SUBMITTED: "Đang lưu nháp",
      PENDING: "Chờ GVCN duyệt",
      APPROVED: "GVCN đã duyệt",
    };

    return {
      hasActivePeriod: true,
      periodName: currentPeriod.name,
      isFrozen: currentPeriod.isFrozen,
      assessment: {
        id: assessment.id,
        status: assessment.status, // NOT_SUBMITTED | PENDING | APPROVED
        statusLabel: statusLabels[assessment.status] || "Không xác định",
        totalStudentScore: assessment.totalStudentScore,
        totalTeacherScore: assessment.totalTeacherScore,
        finalGrade: assessment.finalGrade, // Xuất sắc, Tốt, Khá... (nếu đã khóa sổ)
        teacherComment: assessment.teacherComment,
        lastUpdatedAt: assessment.updatedAt,
      },
    };
  }

  // ============= API cho Assessment: Bảng phiếu chấm từng sinh viên ================
  async getOrCreateAssessment(dto: LoadAssessmentDto) {
    const { studentId, semesterId } = dto;

    // 1. Kiểm tra đợt đánh giá của học kỳ này có hợp lệ/đang mở không
    const period = await this.prismaService.evaluationPeriod.findUnique({
      where: { semesterId },
      include: {
        periodCriteria: true, // Lấy luôn cấu hình tiêu chí của đợt
      },
    });

    if (!period) {
      throw new NotFoundException(
        "Không tìm thấy đợt đánh giá cho học kỳ này.",
      );
    }

    if (!period.isActive) {
      throw new BadRequestException(
        "Đợt đánh giá này hiện đang đóng, không thể khởi tạo phiếu điểm.",
      );
    }

    if (period.periodCriteria.length === 0) {
      throw new BadRequestException(
        "Đợt đánh giá này chưa được cấu hình tiêu chí chấm điểm.",
      );
    }

    // 2. Tìm kiếm phiếu điểm hiện tại của sinh viên
    const existingAssessment = await this.prismaService.assessment.findUnique({
      where: {
        studentId_periodId: {
          studentId,
          periodId: period.id,
        },
      },
      include: {
        details: {
          include: {
            periodCriterion: {
              include: {
                criterion: true,
              },
            },
          },
        },
      },
    });

    // === XỬ LÝ TRƯỜNG HỢP: ĐÃ CÓ ASSESSMENT NHƯNG THIẾU HOẶC MẤT DETAILS ===
    if (existingAssessment) {
      // Lấy danh sách ID các tiêu chí đợt (periodCriterionId) đã có trong DB của sinh viên
      const existingPeriodCriterionIds = existingAssessment.details.map(
        (d) => d.periodCriterionId,
      );

      // Lọc ra các tiêu chí trong đợt hiện tại chưa được tạo dòng chi tiết cho sinh viên này
      const missingPeriodCriteria = period.periodCriteria.filter(
        (pc) => !existingPeriodCriterionIds.includes(pc.id),
      );

      // Nếu không thiếu tiêu chí nào -> An toàn trả về luôn!
      if (missingPeriodCriteria.length === 0) {
        return existingAssessment;
      }

      // Tiến hành tạo bù các dòng chi tiết bị thiếu bằng Transaction
      return await this.prismaService.$transaction(async (tx) => {
        // Tạo hàng loạt các chi tiết bị thiếu
        await tx.assessmentDetail.createMany({
          data: missingPeriodCriteria.map((pc) => ({
            assessmentId: existingAssessment.id,
            periodCriterionId: pc.id,
            studentScore: 0,
            teacherScore: 0,
          })),
          skipDuplicates: true, // Phòng hờ lỗi trùng lặp khi chạy song song
        });

        // Lấy lại dữ liệu Assessment hoàn chỉnh sau khi đã nạp đủ details
        const fullAssessment = await tx.assessment.findUnique({
          where: { id: existingAssessment.id },
          include: {
            details: {
              include: {
                periodCriterion: {
                  include: {
                    criterion: true,
                  },
                },
              },
            },
          },
        });

        return fullAssessment;
      });
    }

    // 3. Nếu CHƯA tồn tại cả Assessment -> Khởi tạo mới từ đầu (Bảo toàn Logic cũ của bạn)
    return await this.prismaService.$transaction(async (tx) => {
      const newAssessment = await tx.assessment.create({
        data: {
          studentId,
          periodId: period.id,
          status: AssessmentStatus.NOT_SUBMITTED,
          totalStudentScore: 0,
          totalTeacherScore: 0,
          // Tạo hàng loạt các dòng chi tiết dựa trên tiêu chí của đợt
          details: {
            create: period.periodCriteria.map((pc) => ({
              periodCriterionId: pc.id,
              studentScore: 0,
              teacherScore: 0,
            })),
          },
        },
        include: {
          details: {
            include: {
              periodCriterion: {
                include: {
                  criterion: true,
                },
              },
            },
          },
        },
      });

      return newAssessment;
    });
  }

  async updateAssessment(dto: UpdateAssessmentDto) {
    const { assessmentId, status, teacherComment, details } = dto;

    // 1. Kiểm tra phiếu điểm tồn tại và xem đợt đánh giá có bị khóa (isFrozen) chưa
    const assessment = await this.prismaService.assessment.findUnique({
      where: { id: assessmentId },
      include: { period: true },
    });

    if (!assessment) {
      throw new NotFoundException("Không tìm thấy phiếu điểm cần cập nhật.");
    }

    if (assessment.period.isFrozen) {
      throw new BadRequestException(
        "Đợt đánh giá này đã khóa sổ, không thể chỉnh sửa điểm.",
      );
    }

    // Học sinh cố tình đẩy điểm lên khi giáo viên đã duyệt
    if (assessment.status === AssessmentStatus.APPROVED) {
      throw new BadRequestException(
        "Phiếu điểm đã được phê duyệt, không thể thay đổi dữ liệu.",
      );
    }

    // 2. Chạy Transaction để thực hiện cập nhật điểm chi tiết
    return await this.prismaService.$transaction(async (tx) => {
      // Cập nhật từng dòng điểm chi tiết một
      for (const detail of details) {
        await tx.assessmentDetail.update({
          where: { id: detail.id },
          data: {
            // Dùng toán tử rút gọn: chỉ cập nhật nếu FE truyền lên giá trị
            ...(detail.studentScore !== undefined && {
              studentScore: detail.studentScore,
            }),
            ...(detail.teacherScore !== undefined && {
              teacherScore: detail.teacherScore,
            }),
          },
        });
      }

      // 3. Tính toán lại tổng điểm động trực tiếp từ Database để đảm bảo an toàn, tránh tin tặc hack payload tổng điểm từ FE
      const updatedDetails = await tx.assessmentDetail.findMany({
        where: { assessmentId },
      });

      const totalStudentScore = updatedDetails.reduce(
        (sum, d) => sum + d.studentScore,
        0,
      );
      const totalTeacherScore = updatedDetails.reduce(
        (sum, d) => sum + d.teacherScore,
        0,
      );

      // 4. Logic tự động Xếp loại (EvaluationGrade) dựa theo điểm của Giáo viên khi trạng thái chuyển sang APPROVED
      let finalGrade: EvaluationGrade | null = null;
      if (status === AssessmentStatus.APPROVED) {
        if (totalTeacherScore >= 90) finalGrade = EvaluationGrade.EXCELLENT;
        else if (totalTeacherScore >= 80) finalGrade = EvaluationGrade.GOOD;
        else if (totalTeacherScore >= 65) finalGrade = EvaluationGrade.FAIR;
        else if (totalTeacherScore >= 50) finalGrade = EvaluationGrade.AVERAGE;
        else finalGrade = EvaluationGrade.POOR;
      }

      // 5. Tiến hành cập nhật lại bảng điểm tổng quát (Assessment)
      const updatedAssessment = await tx.assessment.update({
        where: { id: assessmentId },
        data: {
          status,
          totalStudentScore,
          totalTeacherScore,
          finalGrade,
          ...(teacherComment !== undefined && { teacherComment }),
        },
        include: {
          details: {
            include: {
              periodCriterion: {
                include: { criterion: true },
              },
            },
          },
        },
      });

      return updatedAssessment;
    });
  }
}
