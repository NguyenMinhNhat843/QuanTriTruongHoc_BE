// application.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service"; // Giả sử bạn đã có PrismaModule
import {
  CreateApplyApplicationDto,
  FindApplicationQueryDto,
  UpdateApplicationDto,
} from "./applyAdmission.dto";

@Injectable()
export class ApplicationService {
  constructor(private prisma: PrismaService) {}

  // Tạo mới đơn ứng tuyển
  async create(data: CreateApplyApplicationDto) {
    return this.prisma.application.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        rawdata: data.rawdata,
        admissionItemId: data.admissionItemId,
        admissionId: data.admissionId,
      },
      include: {
        admissionItem: true, // Trả về kèm thông tin đợt tuyển
      },
    });
  }

  // Lấy danh sách (có phân trang & filter cơ bản)
  async findAll(query: FindApplicationQueryDto) {
    const { skip, take, status, admissionId } = query;
    return this.prisma.application.findMany({
      skip,
      take,
      where: {
        status: status as any,
        admissionId: admissionId,
      },
      include: {
        admissionItem: {
          include: { major: true }, // Lấy luôn thông tin ngành học
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // Lấy chi tiết 1 đơn
  async findOne(id: number) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: { admissionItem: true },
    });
    if (!application)
      throw new NotFoundException(`Application with ID ${id} not found`);
    return application;
  }

  // Cập nhật thông tin hoặc chuyển trạng thái (ADMITTED, REJECTED...)
  async update(id: number, data: UpdateApplicationDto) {
    // Kiểm tra tồn tại trước khi update
    await this.findOne(id);

    return this.prisma.application.update({
      where: { id },
      data,
    });
  }

  // Xóa đơn
  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.application.delete({
      where: { id },
    });
  }

  // Thống kê nhanh theo trạng thái (Hữu ích cho Dashboard)
  async getStats() {
    return this.prisma.application.groupBy({
      by: ["status"],
      _count: {
        _all: true,
      },
    });
  }
}
