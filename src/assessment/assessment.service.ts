import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreatePeriodDto,
  CreateCriterionDto,
  SubmitAssessmentDto,
  ApproveAssessmentDto,
} from "./assessment.dto";
import {
  AssessmentStatus,
  EvaluationGrade,
} from "../../prisma/generated/prisma/client";

@Injectable()
export class AssessmentService {
  constructor(private prisma: PrismaService) {}

  // =========================================================================
  // 1. NGHIỆP VỤ PHÒNG CTHS (ADMIN/STAFF) - ĐỢT ĐÁNH GIÁ & TIÊU CHÍ
  // =========================================================================

  /**
   * Tạo đợt đánh giá mới
   */
  async createPeriod(dto: CreatePeriodDto) {
    // Mặc định đợt mới isActive = true, isFrozen = false
    return this.prisma.evaluationPeriod.create({
      data: {
        name: dto.name,
        isActive: true,
        isFrozen: false,
      },
    });
  }

  /**
   * Lấy danh sách đợt đánh giá
   */
  async getPeriods() {
    return this.prisma.evaluationPeriod.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Tạo tiêu chí chuẩn mới
   */
  async createCriterion(dto: CreateCriterionDto) {
    return this.prisma.criterion.create({
      data: {
        title: dto.title,
        maxScore: dto.maxScore,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  /**
   * Lấy danh sách tiêu chí chuẩn
   */
  async getCriteria() {
    return this.prisma.criterion.findMany({
      orderBy: { sortOrder: "asc" },
    });
  }

  // =========================================================================
  // 2. NGHIỆP VỤ HỌC SINH (STUDENT) - TỰ CHẤM ĐIỂM
  // =========================================================================

  /**
   * Lấy phiếu điểm cá nhân của học sinh trong đợt đánh giá
   * Nếu chưa có phiếu, hệ thống tự động khởi tạo bản nháp (NOT_SUBMITTED)
   */
  async getMyAssessment(userId: number, periodId: number) {
    // 1. Tìm hồ sơ Student tương ứng với User đăng nhập
    const student = await this.prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      throw new NotFoundException(
        "Không tìm thấy hồ sơ học sinh của tài khoản này",
      );
    }

    // 2. Kiểm tra đợt đánh giá có tồn tại không
    const period = await this.prisma.evaluationPeriod.findUnique({
      where: { id: periodId },
    });

    if (!period) {
      throw new NotFoundException(
        `Không tìm thấy đợt đánh giá với ID ${periodId}`,
      );
    }

    // 3. Tìm phiếu điểm hiện tại
    let assessment = await this.prisma.assessment.findUnique({
      where: {
        studentId_periodId: {
          studentId: student.id,
          periodId: periodId,
        },
      },
      include: {
        details: {
          include: {
            criterion: true,
          },
        },
      },
    });

    // 4. Nếu chưa có phiếu, tự động khởi tạo
    if (!assessment) {
      const criteria = await this.prisma.criterion.findMany({
        orderBy: { sortOrder: "asc" },
      });

      // Tạo phiếu điểm mới trong Transaction
      assessment = await this.prisma.$transaction(async (tx) => {
        const newAssessment = await tx.assessment.create({
          data: {
            studentId: student.id,
            periodId: periodId,
            status: AssessmentStatus.NOT_SUBMITTED,
          },
        });

        // Tạo chi tiết cho từng tiêu chí
        if (criteria.length > 0) {
          await tx.assessmentDetail.createMany({
            data: criteria.map((c) => ({
              assessmentId: newAssessment.id,
              criterionId: c.id,
              studentScore: 0,
              teacherScore: 0,
            })),
          });
        }

        return tx.assessment.findUnique({
          where: { id: newAssessment.id },
          include: {
            details: {
              include: {
                criterion: true,
              },
            },
          },
        });
      });
    }

    return assessment;
  }

  /**
   * Học sinh tự chấm và gửi phiếu điểm (NOT_SUBMITTED -> PENDING)
   */
  async submitAssessment(userId: number, dto: SubmitAssessmentDto) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      throw new NotFoundException(
        "Không tìm thấy hồ sơ học sinh của tài khoản này",
      );
    }

    // Kiểm tra đợt đánh giá
    const period = await this.prisma.evaluationPeriod.findUnique({
      where: { id: dto.periodId },
    });

    if (!period) {
      throw new NotFoundException("Không tìm thấy đợt đánh giá");
    }

    if (!period.isActive) {
      throw new BadRequestException(
        "Đợt đánh giá này đã đóng, không thể nộp phiếu",
      );
    }

    if (period.isFrozen) {
      throw new BadRequestException(
        "Đợt đánh giá này đã khóa sổ, không thể thay đổi",
      );
    }

    // Tìm phiếu điểm
    const assessment = await this.prisma.assessment.findUnique({
      where: {
        studentId_periodId: {
          studentId: student.id,
          periodId: dto.periodId,
        },
      },
    });

    if (!assessment) {
      throw new NotFoundException(
        "Phiếu điểm chưa được khởi tạo. Hãy lấy thông tin phiếu điểm trước.",
      );
    }

    if (
      assessment.status !== AssessmentStatus.NOT_SUBMITTED &&
      assessment.status !== AssessmentStatus.PENDING
    ) {
      throw new BadRequestException(
        "Phiếu điểm đã được giáo viên duyệt, không thể tự sửa đổi.",
      );
    }

    // Kiểm tra tính hợp lệ của điểm tự chấm
    const criteria = await this.prisma.criterion.findMany();
    const criteriaMap = new Map(criteria.map((c) => [c.id, c.maxScore]));

    let totalStudentScore = 0;

    // Cập nhật từng chi tiết tiêu chí trong transaction
    await this.prisma.$transaction(async (tx) => {
      for (const detail of dto.details) {
        const maxScore = criteriaMap.get(detail.criterionId);
        if (maxScore === undefined) {
          throw new BadRequestException(
            `Tiêu chí ID ${detail.criterionId} không tồn tại`,
          );
        }
        if (detail.studentScore > maxScore) {
          throw new BadRequestException(
            `Điểm tự chấm cho tiêu chí ID ${detail.criterionId} là ${detail.studentScore}, vượt quá điểm tối đa cho phép là ${maxScore}`,
          );
        }

        // Cập nhật điểm chi tiết
        await tx.assessmentDetail.update({
          where: {
            assessmentId_criterionId: {
              assessmentId: assessment.id,
              criterionId: detail.criterionId,
            },
          },
          data: {
            studentScore: detail.studentScore,
          },
        });

        totalStudentScore += detail.studentScore;
      }

      // Cập nhật thông tin tổng hợp của phiếu điểm và chuyển sang trạng thái PENDING
      await tx.assessment.update({
        where: { id: assessment.id },
        data: {
          totalStudentScore,
          status: AssessmentStatus.PENDING,
        },
      });
    });

    return {
      message: "Gửi phiếu điểm tự đánh giá thành công",
      totalStudentScore,
    };
  }

  // =========================================================================
  // 3. NGHIỆP VỤ GIÁO VIÊN CHỦ NHIỆM (TEACHER) - ĐÁNH GIÁ & DUYỆT
  // =========================================================================

  /**
   * Lấy thông tin lớp học do giáo viên chủ nhiệm
   */
  private async getManagedClassByTeacherUserId(teacherUserId: number) {
    const staff = await this.prisma.staff.findUnique({
      where: { userId: teacherUserId },
    });

    if (!staff) {
      throw new ForbiddenException(
        "Tài khoản này không phải là nhân viên/giáo viên",
      );
    }

    const classManaged = await this.prisma.class.findFirst({
      where: { formTeacherId: staff.id },
    });

    if (!classManaged) {
      throw new ForbiddenException("Giáo viên này không làm chủ nhiệm lớp nào");
    }

    return classManaged;
  }

  /**
   * GVCN lấy danh sách học sinh của lớp mình chủ nhiệm kèm trạng thái phiếu rèn luyện
   */
  async getClassStudentsAssessments(teacherUserId: number, periodId: number) {
    const classManaged =
      await this.getManagedClassByTeacherUserId(teacherUserId);

    // Tìm tất cả học sinh trong lớp
    const students = await this.prisma.student.findMany({
      where: { classId: classManaged.id },
      include: {
        assessments: {
          where: { periodId },
          select: {
            id: true,
            status: true,
            totalStudentScore: true,
            totalTeacherScore: true,
            finalGrade: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { studentCode: "asc" },
    });

    return students.map((s) => {
      const assessment = s.assessments[0] || null;
      return {
        studentId: s.id,
        studentCode: s.studentCode,
        fullName: s.fullName || "Chưa cập nhật",
        assessmentId: assessment?.id || null,
        status: assessment?.status || AssessmentStatus.NOT_SUBMITTED,
        totalStudentScore: assessment?.totalStudentScore || 0,
        totalTeacherScore: assessment?.totalTeacherScore || 0,
        finalGrade: assessment?.finalGrade || null,
        updatedAt: assessment?.updatedAt || null,
      };
    });
  }

  /**
   * GVCN xem chi tiết phiếu điểm rèn luyện của một học sinh trong lớp mình chủ nhiệm
   */
  async getStudentAssessmentForTeacher(
    teacherUserId: number,
    assessmentId: number,
  ) {
    const classManaged =
      await this.getManagedClassByTeacherUserId(teacherUserId);

    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        student: true,
        details: {
          include: {
            criterion: true,
          },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundException("Không tìm thấy phiếu điểm");
    }

    // Đảm bảo học sinh thuộc lớp giáo viên chủ nhiệm
    if (assessment.student.classId !== classManaged.id) {
      throw new ForbiddenException(
        "Học sinh này không thuộc lớp do bạn chủ nhiệm",
      );
    }

    return assessment;
  }

  /**
   * GVCN đánh giá, điều chỉnh và duyệt phiếu điểm (PENDING -> APPROVED)
   */
  async approveAssessment(teacherUserId: number, dto: ApproveAssessmentDto) {
    const classManaged =
      await this.getManagedClassByTeacherUserId(teacherUserId);

    const assessment = await this.prisma.assessment.findUnique({
      where: { id: dto.assessmentId },
      include: {
        student: true,
        period: true,
      },
    });

    if (!assessment) {
      throw new NotFoundException("Không tìm thấy phiếu điểm");
    }

    if (assessment.student.classId !== classManaged.id) {
      throw new ForbiddenException(
        "Học sinh này không thuộc lớp do bạn chủ nhiệm",
      );
    }

    if (assessment.period.isFrozen) {
      throw new BadRequestException(
        "Đợt đánh giá đã bị khóa sổ, không thể điều chỉnh điểm",
      );
    }

    if (
      assessment.status !== AssessmentStatus.PENDING &&
      assessment.status !== AssessmentStatus.APPROVED
    ) {
      throw new BadRequestException(
        "Phiếu điểm chưa nộp (NOT_SUBMITTED), giáo viên chưa thể duyệt",
      );
    }

    const criteria = await this.prisma.criterion.findMany();
    const criteriaMap = new Map(criteria.map((c) => [c.id, c.maxScore]));

    let totalTeacherScore = 0;

    await this.prisma.$transaction(async (tx) => {
      for (const detail of dto.details) {
        const maxScore = criteriaMap.get(detail.criterionId);
        if (maxScore === undefined) {
          throw new BadRequestException(
            `Tiêu chí ID ${detail.criterionId} không tồn tại`,
          );
        }
        if (detail.teacherScore > maxScore) {
          throw new BadRequestException(
            `Điểm duyệt cho tiêu chí ID ${detail.criterionId} là ${detail.teacherScore}, vượt quá điểm tối đa cho phép là ${maxScore}`,
          );
        }

        // Cập nhật điểm GVCN chấm
        await tx.assessmentDetail.update({
          where: {
            assessmentId_criterionId: {
              assessmentId: assessment.id,
              criterionId: detail.criterionId,
            },
          },
          data: {
            teacherScore: detail.teacherScore,
          },
        });

        totalTeacherScore += detail.teacherScore;
      }

      // Cập nhật phiếu điểm rèn luyện và chuyển trạng thái thành APPROVED
      await tx.assessment.update({
        where: { id: assessment.id },
        data: {
          totalTeacherScore,
          teacherComment: dto.teacherComment,
          status: AssessmentStatus.APPROVED,
        },
      });
    });

    return {
      message: "Duyệt phiếu điểm rèn luyện thành công",
      totalTeacherScore,
    };
  }

  // =========================================================================
  // 4. KHÓA SỔ & CÔNG BỐ (ADMIN/STAFF) - TỰ ĐỘNG XẾP LOẠI & HIỂN THỊ KẾT QUẢ
  // =========================================================================

  /**
   * Tính xếp loại rèn luyện tự động dựa theo thang điểm quy chuẩn
   */
  private calculateGrade(score: number): EvaluationGrade {
    if (score >= 90) return EvaluationGrade.EXCELLENT;
    if (score >= 80) return EvaluationGrade.GOOD;
    if (score >= 65) return EvaluationGrade.FAIR;
    if (score >= 50) return EvaluationGrade.AVERAGE;
    return EvaluationGrade.POOR;
  }

  /**
   * Khóa sổ đợt đánh giá: Tính toán xếp loại rèn luyện tự động cho toàn bộ học sinh
   */
  async freezePeriod(periodId: number) {
    const period = await this.prisma.evaluationPeriod.findUnique({
      where: { id: periodId },
    });

    if (!period) {
      throw new NotFoundException("Không tìm thấy đợt đánh giá");
    }

    if (period.isFrozen) {
      throw new BadRequestException(
        "Đợt đánh giá này đã được khóa sổ trước đó",
      );
    }

    // Lấy tất cả các phiếu điểm của đợt này
    const assessments = await this.prisma.assessment.findMany({
      where: { periodId },
      include: {
        details: true,
      },
    });

    await this.prisma.$transaction(async (tx) => {
      // Cập nhật đợt đánh giá thành đóng băng (isFrozen = true, isActive = false)
      await tx.evaluationPeriod.update({
        where: { id: periodId },
        data: {
          isFrozen: true,
          isActive: false,
        },
      });

      // Duyệt qua từng phiếu điểm và áp dụng luật xử lý tự động khi khóa sổ
      for (const assessment of assessments) {
        let finalScore = 0;
        let targetStatus = assessment.status;

        if (assessment.status === AssessmentStatus.APPROVED) {
          // 1. Nếu GVCN đã duyệt, lấy điểm của GVCN để xếp loại
          finalScore = assessment.totalTeacherScore;
        } else if (assessment.status === AssessmentStatus.PENDING) {
          // 2. Nếu học sinh đã gửi nhưng GVCN chưa duyệt:
          // Tự động đồng bộ điểm GVCN chấm = điểm HS tự chấm
          finalScore = assessment.totalStudentScore;
          targetStatus = AssessmentStatus.APPROVED;

          // Cập nhật chi tiết các tiêu chí (teacherScore = studentScore)
          for (const d of assessment.details) {
            await tx.assessmentDetail.update({
              where: { id: d.id },
              data: { teacherScore: d.studentScore },
            });
          }
        } else {
          // 3. Nếu chưa nộp (NOT_SUBMITTED), tổng điểm = 0, xếp loại POOR
          finalScore = 0;
          targetStatus = AssessmentStatus.APPROVED;

          // Cập nhật chi tiết các tiêu chí (teacherScore = 0)
          for (const d of assessment.details) {
            await tx.assessmentDetail.update({
              where: { id: d.id },
              data: { teacherScore: 0 },
            });
          }
        }

        const finalGrade = this.calculateGrade(finalScore);

        // Cập nhật phiếu điểm rèn luyện sau khóa sổ
        await tx.assessment.update({
          where: { id: assessment.id },
          data: {
            totalTeacherScore: finalScore,
            status: targetStatus,
            finalGrade,
          },
        });
      }
    });

    return {
      message: `Đã khóa sổ thành công đợt đánh giá: ${period.name}. Công bố kết quả xếp loại rèn luyện toàn trường.`,
    };
  }
}
