import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { CreateStaffDto, SearchStaffDto, UpdateStaffDto } from "./staff.dto.js";
import { generateId } from "../utils/generateId.js";
import { Prisma } from "../../prisma/generated/prisma/client.js";
import {
  StaffResponseDto,
  TeacherDashboardStatsResponseDto,
} from "./staff.response.js";
import { plainToInstance } from "class-transformer";

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async createStaff(data: CreateStaffDto): Promise<StaffResponseDto> {
    try {
      const staff = await this.prisma.$transaction(async (tx) => {
        // 4. Tạo Staff liên kết với User vừa tạo
        return await tx.staff.create({
          data: {
            ...data,
            staffCode: `NV${generateId()}`,
          },
          include: { user: true },
        });
      });

      return plainToInstance(StaffResponseDto, staff);
    } catch (error) {
      console.log("Error creating staff:", error);
      throw new InternalServerErrorException("Lỗi hệ thống khi tạo nhân viên");
    }
  }

  /**
   * Cập nhật thông tin nhân viên và tài khoản liên quan
   */
  async updateStaff(
    id: number,
    data: UpdateStaffDto,
  ): Promise<StaffResponseDto> {
    // 1. Kiểm tra staff có tồn tại không
    const staff = await this.prisma.staff.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!staff) {
      throw new NotFoundException("Không tìm thấy thông tin nhân viên");
    }

    const { isActive, ...staffData } = data;

    // 2. Chuẩn bị dữ liệu cập nhật cho User (nếu có)
    const userData: any = {};
    if (isActive !== undefined) userData.isActive = isActive;

    try {
      const staff = await this.prisma.$transaction(async (tx) => {
        // Cập nhật bảng User nếu có dữ liệu thay đổi
        if (Object.keys(userData).length > 0) {
          await tx.user.update({
            where: { id: staff.userId !== null ? staff.userId : undefined },
            data: userData,
          });
        }

        // Cập nhật bảng Staff
        return await tx.staff.update({
          where: { id },
          data: {
            ...staffData,
          },
          include: { user: true },
        });
      });

      return plainToInstance(StaffResponseDto, staff);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException(
          "Username hoặc Email đã tồn tại trên hệ thống",
        );
      }
      throw new InternalServerErrorException(
        "Lỗi khi cập nhật thông tin nhân viên",
      );
    }
  }

  /**
   * Tìm giáo viên
   */
  async searchStaffs(query: SearchStaffDto): Promise<StaffResponseDto[]> {
    const {
      page = 1,
      limit = 10,
      keyword,
      departmentId,
      position,
      sortBy = "createdAt",
      sortOrder = "desc",
      employeeRole,
    } = query;

    const skip = (page - 1) * limit;

    // Xây dựng điều kiện lọc
    const where: Prisma.StaffWhereInput = {
      AND: [
        keyword
          ? {
              OR: [
                { staffCode: { contains: keyword, mode: "insensitive" } },
                { fullName: { contains: keyword, mode: "insensitive" } },
                { email: { contains: keyword, mode: "insensitive" } },
                { identityNumber: { contains: keyword, mode: "insensitive" } },
                {
                  user: {
                    username: { contains: keyword, mode: "insensitive" },
                  },
                },
              ],
            }
          : {},
        departmentId ? { departmentId } : {},
        position
          ? { position: { contains: position, mode: "insensitive" } }
          : {},
        employeeRole ? { EmployeeRole: employeeRole } : {},
      ],
    };

    const [total, items] = await Promise.all([
      this.prisma.staff.count({ where }),
      this.prisma.staff.findMany({
        where,
        include: { user: true },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
    ]);
    console.log("Total staff found:", total);

    return plainToInstance(StaffResponseDto, items);
  }

  /**
   * Lấy chi tiết 1 giáo viên
   */
  async getDetailStaff(staffCode: string) {
    const staff = await this.prisma.staff.findUnique({
      where: {
        staffCode,
      },
      include: {
        user: true,
        teacherSubjects: {
          include: {
            subject: true,
          },
        },
      },
    });

    return plainToInstance(StaffResponseDto, staff);
  }

  /**
   * Cấp tài khoản cho giáo viên
   */
  async applyAccountForTeacher(teacherId: number) {
    const teacher = await this.prisma.staff.findUnique({
      where: {
        id: teacherId,
      },
    });

    if (!teacher) {
      throw new BadRequestException("User này không tồn tại");
    }

    // Tạo account
    const account = await this.prisma.user.create({
      data: {
        username: teacher.staffCode,
        role: teacher.EmployeeRole === "STAFF" ? "staff" : "teacher",
        passwordHash: "123456",
        staffId: teacher.id,
      },
    });

    return account;
  }

  /**
   * Lấy thống kê cho trang home của giáo viên
   */
  async getTeacherDasboardStats(
    teacherId: number,
    semesterId?: number,
  ): Promise<TeacherDashboardStatsResponseDto> {
    const profile = await this.prisma.staff.findUnique({
      where: { id: teacherId },
      include: {
        department: true,
      },
    });

    const lopHocDangChuNhiem = await this.prisma.class.findMany({
      where: {
        formTeacherId: teacherId,
      },
    });
    const soLuongLopHocChuNhiem = lopHocDangChuNhiem.length;

    const monHocDangGiangDay = await this.prisma.courseOffer.findMany({
      where: {
        teacherId,
        semesterId: semesterId || undefined,
      },
    });
    const soLuongMonHocDangGiangDay = monHocDangGiangDay.length;

    return plainToInstance(TeacherDashboardStatsResponseDto, {
      id: teacherId,
      name: profile?.fullName,
      role: profile?.EmployeeRole,
      maGiaoVien: profile?.staffCode,
      department: profile?.department?.deptName,
      totalClasses: soLuongLopHocChuNhiem,
      totalSubjects: soLuongMonHocDangGiangDay,
    });
  }
}
