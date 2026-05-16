import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateManyGradeEntriesDto } from "./gradEntry.dto";

@Injectable()
export class GradeEntryService {
  constructor(private prisma: PrismaService) {}

  async submitGrade(dto: CreateManyGradeEntriesDto) {
    const { courseOfferId, createdBy, grades } = dto;

    // Chuẩn bị dữ liệu thô mapping khớp hoàn toàn với cấu trúc mảng của Prisma
    const rawEntries = grades.map((item) => ({
      courseOfferId: courseOfferId,
      studentId: item.studentId,
      componentId: item.componentId,
      score: item.score,
      status: item.status ?? "PENDING", // fallback về mặc định nếu client không gửi lên
      createdBy: createdBy,
    }));

    // Thực hiện transaction tạo đồng loạt siêu tốc dưới DB
    const result = await this.prisma.gradeEntry.createMany({
      data: rawEntries,
      skipDuplicates: true, // Nếu trùng khớp @@unique([studentId, courseOfferId, componentId]) sẽ bỏ qua hoặc không làm sập API
    });

    return {
      message: "Xử lý danh sách điểm thành công",
      count: result.count,
    };
  }
}
