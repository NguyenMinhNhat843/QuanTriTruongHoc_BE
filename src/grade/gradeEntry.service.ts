import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  ApproveGradeEntryDto,
  CreateManyGradeEntriesDto,
} from "./gradEntry.dto";
import {
  SubmissionHistoryResponse,
  SubmitGradeResponse,
} from "./gradeSubmis.response";
import { plainToInstance } from "class-transformer";

@Injectable()
export class GradeEntryService {
  constructor(private prisma: PrismaService) {}

  /**
   * Gửi phê duyệt điểm
   */
  async submitGrade(
    dto: CreateManyGradeEntriesDto,
  ): Promise<SubmitGradeResponse> {
    const { grades, createdBy, courseOfferId } = dto;

    // Kiểm tra nếu đàn có đơn chờ duyệt trước đó chưa được xử lý thì không cho submit mới
    const existingPendingSubmission =
      await this.prisma.gradeSubmission.findFirst({
        where: {
          courseOfferId,
          status: "PENDING",
        },
      });

    if (existingPendingSubmission) {
      throw new InternalServerErrorException(
        "Bạn đã có một đơn phê duyệt điểm đang chờ xử lý. Vui lòng đợi hoàn tất trước khi nộp đơn mới.",
      );
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        // 1. Tạo đơn phê duyệt điểm
        const submission = await tx.gradeSubmission.create({
          data: {
            status: "PENDING",
            submitter: { connect: { id: createdBy } },
            courseOffer: { connect: { id: courseOfferId } },
          },
        });

        await tx.gradeEntry.createMany({
          data: grades.map((grade) => ({
            ...grade,
            gradeSubmissionId: submission.id,
          })),
        });
      });

      return {
        message:
          "Điểm đã được nộp phê duyệt thành công. Vui lòng chờ giảng viên duyệt điểm.",
        status: true,
      };
    } catch (error) {
      console.error("Lỗi khi submit điểm:", error);

      // 💡 THAY ĐỔI Ở ĐÂY: Ném lỗi ra thay vì return object thông thường
      // Việc này giúp Transaction rollback triệt để và báo lỗi HTTP (ví dụ: 500) về Frontend
      throw new InternalServerErrorException(
        "Có lỗi xảy ra khi nộp điểm. Vui lòng thử lại sau.",
      );
    }
  }

  /**
   * Phê duyệt điểm
   */
  async approveGradeEntry(data: ApproveGradeEntryDto) {
    const { gradeSubmissionId, approverId } = data;
    const updatedGradeSubmission = await this.prisma.gradeSubmission.update({
      where: { id: gradeSubmissionId },
      data: {
        status: "APPROVED",
        approvedBy: approverId,
        updatedAt: new Date(),
      },
    });
    return updatedGradeSubmission;
  }

  /**
   * Lấy lịch sử submit
   */
  async getSubmissionHistory(courseOfferId: number) {
    const result = await this.prisma.gradeSubmission.findMany({
      where: { courseOfferId },
      include: {
        gradeEntries: true,
      },
    });

    return plainToInstance(SubmissionHistoryResponse, result);
  }
}
