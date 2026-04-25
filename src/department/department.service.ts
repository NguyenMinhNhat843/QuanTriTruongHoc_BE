import {
  Injectable,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service"; // Đường dẫn tới PrismaService của bạn
import { CreateDepartmentDto, UpdateDepartmentDto } from "./department.dto";

@Injectable()
export class DepartmentService {
  constructor(private prisma: PrismaService) {}

  async createDepartment(data: CreateDepartmentDto) {
    // Kiểm tra trùng mã phòng ban (deptCode)
    const existing = await this.prisma.department.findUnique({
      where: { deptCode: data.deptCode },
    });

    if (existing) {
      throw new ConflictException(`Mã phòng ban ${data.deptCode} đã tồn tại`);
    }

    return this.prisma.department.create({
      data,
      include: { majors: true }, // Trả về kèm danh sách ngành học nếu cần
    });
  }

  async findAll() {
    return this.prisma.department.findMany({
      include: {
        _count: {
          select: { majors: true },
        },
      },
    });
  }

  async findOne(id: number) {
    const dept = await this.prisma.department.findUnique({
      where: { id },
      include: { majors: true },
    });

    if (!dept) {
      throw new NotFoundException(`Không tìm thấy phòng ban với ID ${id}`);
    }
    return dept;
  }

  async updateDepartment(id: number, data: UpdateDepartmentDto) {
    // Kiểm tra xem phòng ban có tồn tại không trước khi update
    await this.findOne(id);

    return this.prisma.department.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.department.delete({
      where: { id },
    });
  }
}
