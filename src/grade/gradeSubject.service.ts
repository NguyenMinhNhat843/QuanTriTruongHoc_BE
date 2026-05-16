import { BadRequestException, Injectable } from "@nestjs/common";
import { CreateSubjectGradeWeightsDto } from "./gradeSubject.dto";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma } from "../../prisma/generated/prisma/client";

@Injectable()
export class GradeSubjectService {
  constructor(private readonly prisma: PrismaService) {}

  async createSubjectWeights(
    dto: CreateSubjectGradeWeightsDto,
    tx?: Prisma.TransactionClient, // Chấp nhận nhận vào một transaction client từ bên ngoài
  ) {
    // 1. Kiểm tra tổng trọng số gửi lên có bằng 100% (1.0) hay không
    const totalWeight = dto.gradeComponents.reduce(
      (sum, item) => sum + item.weight,
      0,
    );

    if (Math.abs(totalWeight - 1.0) > 0.001) {
      throw new BadRequestException(
        "Tổng trọng số điểm của các thành phần phải bằng 1.0 (100%)",
      );
    }

    // 2. Định nghĩa các bước xử lý DB
    const executeOperations = async (
      p: Prisma.TransactionClient | PrismaService,
    ) => {
      await p.subjectGradeWeight.deleteMany({
        where: { subjectId: dto.subjectId },
      });

      return p.subjectGradeWeight.createMany({
        data: dto.gradeComponents.map((item) => ({
          subjectId: dto.subjectId,
          gradeComponentId: item.gradeComponentId,
          weight: item.weight,
        })),
      });
    };

    // 3. Điều hướng thực thi
    // Nếu hàm này ĐANG CHẠY KÈM một transaction được truyền từ ngoài vào, thực thi luôn không tạo vòng lặp $transaction mới
    if (tx) {
      return executeOperations(tx);
    }

    // Nếu CHẠY ĐỘC LẬP (bình thường), tự tạo ra một transaction cục bộ để đảm bảo an toàn dữ liệu (Atomic)
    return this.prisma.$transaction(async (localTx) => {
      return executeOperations(localTx);
    });
  }
}
