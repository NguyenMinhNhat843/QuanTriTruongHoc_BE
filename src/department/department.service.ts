import {
  Injectable,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service"; // Đường dẫn tới PrismaService của bạn
import {
  CreateDepartmentDto,
  ResponseDepartmentDto,
  UpdateDepartmentDto,
} from "./department.dto";
import { plainToInstance } from "class-transformer";

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
      include: { majors: true },
    });
  }

  async findAll() {
    const departments = await this.prisma.department.findMany({
      include: {
        staffs: {
          select: {
            id: true,
            fullName: true,
          },
        },
        majors: {
          select: {
            id: true,
            _count: {
              select: {
                students: true,
              },
            },
          },
        },
        _count: {
          select: {
            majors: true,
            staffs: true,
          },
        },
      },
    });

    const formattedResult = departments.map((dept) => {
      const headOfDept = dept.staffs.find(
        (s) => s.id === dept.headOfDepartmentId,
      );

      const totalStudents = dept.majors.reduce(
        (sum, major) => sum + major._count.students,
        0,
      );

      return {
        id: dept.id,
        deptCode: dept.deptCode,
        deptName: dept.deptName,
        description: dept.description,
        headOfDepartmentId: dept.headOfDepartmentId,
        createdAt: dept.createdAt,
        updatedAt: dept.updatedAt,

        headOfDepartmentName: headOfDept ? headOfDept.fullName : null,
        totalMajors: dept._count.majors,
        totalStaffs: dept._count.staffs,
        totalStudents: totalStudents,
      };
    });

    return plainToInstance(ResponseDepartmentDto, formattedResult);
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
