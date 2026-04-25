import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { CreateStaffDto, SearchStaffDto, UpdateStaffDto } from "./staff.dto.js";
import * as bcrypt from "bcryptjs";
import { RoleType } from "../../prisma/generated/prisma/enums.js";
import { generateId } from "../utils/generateId.js";
import { Prisma } from "../../prisma/generated/prisma/client.js";
import { StaffResponseDto } from "./staff.response.js";
import { ResponsePagination } from "../common/common.response.js";

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async createStaff(data: CreateStaffDto): Promise<StaffResponseDto> {
    const { username, password, fullName, dob, identityNumber, role } = data;

    // 1. Kiểm tra trùng lặp
    const existingUser = await this.prisma.user.findUnique({
      where: { username },
    });
    if (existingUser) throw new ConflictException("Tên đăng nhập đã tồn tại");

    // 2. Hash mật khẩu
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    try {
      const staff = await this.prisma.$transaction(async (tx) => {
        // 3. Tạo User trước
        const user = await tx.user.create({
          data: {
            username,
            passwordHash,
            role: role || RoleType.staff,
            userId: `U${generateId()}`,
            isActive: true,
          },
        });

        // 4. Tạo Staff liên kết với User vừa tạo
        return await tx.staff.create({
          data: {
            userId: user.id,
            staffCode: `STF${generateId()}`,
            fullName,
            dob: new Date(dob),
            email: data.email,
            phone: data.phone,
            gender: data.gender,
            identityNumber: identityNumber,
          },
          include: { user: true },
        });
      });

      return new StaffResponseDto(staff);
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

    const { role, isActive, username, password, ...staffData } = data;

    // 2. Chuẩn bị dữ liệu cập nhật cho User (nếu có)
    const userData: any = {};
    if (role) userData.role = role;
    if (isActive !== undefined) userData.isActive = isActive;
    if (username) userData.username = username;
    if (password) {
      const salt = await bcrypt.genSalt();
      userData.passwordHash = await bcrypt.hash(password, salt);
    }

    // 3. Thực hiện cập nhật trong Transaction
    try {
      const staff = await this.prisma.$transaction(async (tx) => {
        // Cập nhật bảng User nếu có dữ liệu thay đổi
        if (Object.keys(userData).length > 0) {
          await tx.user.update({
            where: { id: staff.userId },
            data: userData,
          });
        }

        // Cập nhật bảng Staff
        return await tx.staff.update({
          where: { id },
          data: {
            ...staffData,
            dob: staffData.dob ? new Date(staffData.dob) : undefined,
          },
          include: { user: true },
        });
      });

      return new StaffResponseDto(staff);
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

  async searchStaffs(
    query: SearchStaffDto,
  ): Promise<ResponsePagination<StaffResponseDto>> {
    const {
      page = 1,
      limit = 10,
      keyword,
      role,
      isActive,
      departmentId,
      position,
      sortBy = "createdAt",
      sortOrder = "desc",
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
        role ? { user: { role } } : {},
        isActive !== undefined ? { user: { isActive } } : {},
        departmentId ? { departmentId } : {},
        position
          ? { position: { contains: position, mode: "insensitive" } }
          : {},
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

    return {
      data: items.map((item) => new StaffResponseDto(item)),
      meta: { total },
    };
  }
}
