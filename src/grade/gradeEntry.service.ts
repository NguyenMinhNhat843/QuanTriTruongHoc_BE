import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  ApproveGradeEntryDto,
  CreateManyGradeEntriesDto,
} from "./gradEntry.dto";
import { SubmitGradeResponse } from "./gradeSubmis.response";

@Injectable()
export class GradeEntryService {
  constructor(private prisma: PrismaService) {}

  // Gửi phê duyệt điểm
  async submitGrade(
    dto: CreateManyGradeEntriesDto,
  ): Promise<SubmitGradeResponse> {
    const { grades, createdBy, courseOfferId } = dto;

    try {
      await this.prisma.$transaction(async (tx) => {
        // 1. Tạo đơn phê duyệt điểm
        const submission = await tx.gradeSubmission.create({
          data: {
            courseOfferId: courseOfferId,
            status: "PENDING",
            submitedBy: createdBy,
          },
        });

        // 2. Tạo danh sách GradeEntry
        await tx.gradeEntry.createMany({
          data: grades.map((grade) => ({
            ...grade,
            gradeSubmissionId: submission.id,
          })),
          skipDuplicates: true,
        });
      });

      return {
        message:
          "Điểm đã được nộp phê duyệt thành công. Vui lòng chờ giảng viên duyệt điểm.",
        status: true,
      };
    } catch (error) {
      console.error("Lỗi khi submit điểm:", error);

      return {
        message: "Có lỗi xảy ra khi nộp điểm. Vui lòng thử lại sau.",
        status: false,
      };
    }
  }

  // Phê duyệt điểm
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
}
