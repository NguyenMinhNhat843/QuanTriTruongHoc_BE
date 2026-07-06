import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateCriterionDto,
  CreatePeriodDto,
  LoadAssessmentDto,
  UpdateAssessmentDto,
  UpdateCriterionDto,
  UpdatePeriodDto,
} from "./assessment.dto";
import { plainToInstance } from "class-transformer";
import {
  CriterionDto,
  EvaluationPeriodDto,
  ResponseEvaluationPeriodDtoWithRelation,
} from "./assessment-response.dto";
import {
  AssessmentStatus,
  EvaluationGrade,
} from "../../prisma/generated/prisma/enums";

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

      await tx.evaluationPeriodCriterion.createMany({
        data:
          criterionIds?.map((criterionId) => ({
            periodId: newPeriod.id,
            criterionId,
            maxScoreSnapshot: 0,
          })) || [],
      });

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

  // ============= API cho Assessment: Bảng phiếu chấm từng sinh viên ================
  async getOrCreateAssessment(dto: LoadAssessmentDto) {
    const { studentId, semesterId } = dto;

    // 1. Kiểm tra đợt đánh giá của học kỳ này có hợp lệ/đang mở không
    const period = await this.prismaService.evaluationPeriod.findUnique({
      where: { semesterId },
      include: {
        periodCriteria: true, // Lấy luôn cấu hình tiêu chí để dùng nếu cần tạo mới
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
                criterion: true, // Lấy kèm thông tin gốc (title, sortOrder...) để FE hiển thị
              },
            },
          },
        },
      },
    });

    // Nếu đã tồn tại, trả về luôn
    if (existingAssessment) {
      return existingAssessment;
    }

    // 3. Nếu CHƯA tồn tại -> Tiến hành khởi tạo mới (Dùng Prisma Transaction để đảm bảo an toàn)
    if (period.periodCriteria.length === 0) {
      throw new BadRequestException(
        "Đợt đánh giá này chưa được cấu hình tiêu chí chấm điểm.",
      );
    }

    return await this.prismaService.$transaction(async (tx) => {
      // Tạo mới phiếu điểm tổng quan
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
