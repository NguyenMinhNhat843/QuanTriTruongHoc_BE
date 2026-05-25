import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SaveGradeEntries, CreateManyGradeEntriesDto } from "./gradEntry.dto";

@Injectable()
export class GradeEntryService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lưu nháp bảng điểm
   */
  async saveDraftGrade(dto: CreateManyGradeEntriesDto) {
    const { grades } = dto;

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.gradeEntry.createMany({
          data: grades.map((grade) => ({
            ...grade,
            status: "PENDING",
          })),
          skipDuplicates: true,
        });
      });

      return {
        message: "Lưu nháp thành công",
        status: true,
      };
    } catch (error) {
      console.error("Lỗi khi Lưu nháp:", error);

      throw new InternalServerErrorException(
        "Có lỗi xảy ra khi lưu nháp điểm. Vui lòng thử lại sau.",
      );
    }
  }

  /**
   * Kiểm tra xem sinh viên đã có đủ tất cả các đầu điểm bắt buộc hay chưa
   */
  private isSubmittingAllRequiredGrades(
    requiredComponentIds: number[],
    studentGradeEntries: any[],
  ): boolean {
    if (requiredComponentIds.length === 0) return false;
    if (studentGradeEntries.length !== requiredComponentIds.length)
      return false;

    // Lấy ra danh sách ID các đầu điểm mà sinh viên hiện có
    const studentComponentIds = studentGradeEntries.map(
      (entry) => entry.componentId,
    );

    // Đảm bảo mọi ID bắt buộc đều phải nằm trong danh sách điểm của sinh viên
    return requiredComponentIds.every((id) => studentComponentIds.includes(id));
  }

  /**
   * Tính toán điểm tổng kết dựa trên cấu hình trọng số chuẩn từ môn học
   */
  private calculateFinalGrade(
    studentGradeEntries: any[],
    gradeComponentConfigs: any[],
  ): number {
    let totalScore = 0;
    let totalWeight = 0;

    for (const entry of studentGradeEntries) {
      // Tìm cấu hình trọng số chuẩn từ môn học dựa theo componentId
      const config = gradeComponentConfigs.find(
        (c) => c.gradeComponent.id === entry.componentId,
      );

      // Lấy weight từ bảng cấu hình trung gian
      const weight = config?.weight || 0;

      totalScore += (entry.score || 0) * (weight / 100);
      totalWeight += weight / 100;
    }

    return totalWeight > 0
      ? Math.round((totalScore / totalWeight) * 100) / 100
      : 0;
  }

  /**
   * Chốt bảng điểm
   */
  async saveGradeEntries(data: SaveGradeEntries) {
    const { grades } = data;

    try {
      await this.prisma.$transaction(async (tx) => {
        // 1. Thực hiện Upsert đồng loạt dữ liệu điểm gửi lên thành APPROVED
        await Promise.all(
          grades.map((grade) =>
            tx.gradeEntry.upsert({
              where: {
                componentId_courseRegistrationId: {
                  componentId: grade.componentId,
                  courseRegistrationId: grade.courseRegistrationId,
                },
              },
              update: { score: grade.score, status: "APPROVED" },
              create: {
                componentId: grade.componentId,
                courseRegistrationId: grade.courseRegistrationId,
                score: grade.score,
                status: "APPROVED",
              },
            }),
          ),
        );

        // 2. Lấy danh sách các bản ghi học phần độc nhất cần kiểm tra tính điểm tổng kết
        const uniqueRegistrationIds = [
          ...new Set(grades.map((g) => g.courseRegistrationId)),
        ];
        if (uniqueRegistrationIds.length === 0) return;

        // 3. Lấy danh sách cấu hình đầu điểm chuẩn của môn học
        const gradeComponentConfigs = await tx.subjectGradeWeight.findMany({
          where: {
            subject: {
              courseOffers: {
                some: {
                  registrations: { some: { id: uniqueRegistrationIds[0] } },
                },
              },
            },
          },
          select: {
            weight: true,
            gradeComponent: { select: { id: true } }, // Chỉ cần lấy ID để tối ưu tốc độ query
          },
        });

        // Tạo mảng danh sách ID đầu điểm bắt buộc để phục vụ so sánh tập hợp
        const requiredComponentIds = gradeComponentConfigs.map(
          (c) => c.gradeComponent.id,
        );

        // 4. Chạy cuốn chiếu qua từng sinh viên để kiểm tra và cập nhật finalGrade
        for (const registrationId of uniqueRegistrationIds) {
          const registration = await tx.courseRegistration.findUnique({
            where: { id: registrationId },
            include: {
              gradeEntries: {
                where: { status: "APPROVED" },
              },
            },
          });

          if (!registration) continue;

          // SỬ DỤNG HÀM TÁCH: Kiểm tra tính khớp nhau của các ID đầu điểm
          const isCompleted = this.isSubmittingAllRequiredGrades(
            requiredComponentIds,
            registration.gradeEntries,
          );

          if (isCompleted) {
            await tx.courseRegistration.update({
              where: { id: registrationId },
              data: {
                status: "completed",
              },
            });
          }
        }
      });

      return {
        message: "Chốt và phê duyệt bảng điểm thành công",
        status: true,
      };
    } catch (error) {
      console.error("Lỗi khi chốt bảng điểm trực tiếp:", error);
      throw new InternalServerErrorException(
        "Có lỗi xảy ra khi chốt điểm. Vui lòng kiểm tra lại dữ liệu hoặc thử lại sau.",
      );
    }
  }
}
