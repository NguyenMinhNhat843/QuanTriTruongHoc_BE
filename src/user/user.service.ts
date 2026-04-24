import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { CreateUserDto, SearchUserDto } from "./user.dto.js";
import { UserResponseDto } from "./user.response.js";
import { generateId } from "../utils/generateId.js";
import { Prisma } from "../../prisma/generated/prisma/client.js";

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async createUser(data: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.prisma.user.create({
      data: {
        ...data,
        userId: `U${generateId()}`,
      },
    });
    return new UserResponseDto(user);
  }

  async updateUser(id: number, data: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.prisma.user.update({
      where: { id },
      data,
    });
    return new UserResponseDto(user);
  }

  async searchUsers(query: SearchUserDto) {
    const {
      page = 1,
      limit = 10,
      keyword,
      role,
      isActive,
      gender,
      fromDate,
      toDate,
      sortBy,
      sortOrder,
    } = query;

    // 1. Tính toán phân trang
    const skip = (page - 1) * limit;

    // 2. Xây dựng điều kiện lọc (Where Clause)
    const where: Prisma.UserWhereInput = {
      deletedAt: null, // Mặc định không lấy các record đã xóa mềm
    };

    // Lọc theo trạng thái và vai trò
    if (isActive !== undefined) where.isActive = isActive;
    if (role) where.role = role;
    if (gender !== undefined) where.gender = gender;

    // Tìm kiếm theo từ khóa (Username, Email, FullName)
    if (keyword) {
      where.OR = [
        { username: { contains: keyword, mode: "insensitive" } },
        { email: { contains: keyword, mode: "insensitive" } },
        { fullName: { contains: keyword, mode: "insensitive" } },
        { phone: { contains: keyword } },
      ];
    }

    // Lọc theo khoảng thời gian tạo (Range Filter)
    if (fromDate || toDate) {
      where.createdAt = {
        ...(fromDate && { gte: new Date(fromDate) }),
        ...(toDate && { lte: new Date(toDate) }),
      };
    }

    // 3. Thực thi truy vấn song song (Data + Total Count)
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy || "createdAt"]: sortOrder || "desc",
        },
        // Bạn có thể include thêm thông tin Student/Staff nếu cần
        include: {
          student: { select: { id: true } },
          staff: { select: { id: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    // 4. Trả về kết quả kèm Metadata
    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }
}
