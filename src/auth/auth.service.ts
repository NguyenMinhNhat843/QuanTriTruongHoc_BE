import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service.js";
import { LoginDto, RegisterDto, SearchAccountDto } from "./auth.dto.js";
import * as bcrypt from "bcryptjs";
import { plainToInstance } from "class-transformer";
import { AccountResponseDto } from "./auth.resposne.js";
import { Response } from "express";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(body: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { username: body.username },
    });

    if (existingUser) {
      throw new UnauthorizedException("Tên người dùng đã tồn tại");
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    return await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          username: body.username,
          passwordHash: hashedPassword,
          role: body.role,
          studentId: body.studentId,
          staffId: body.staffId,
        },
      });

      if (body.staffId) {
        await tx.staff.update({
          where: { id: body.staffId },
          data: {
            userId: newUser.id,
          },
        });
      } else if (body.studentId) {
        await tx.student.update({
          where: { id: body.studentId },
          data: {
            userId: newUser.id,
          },
        });
      }

      return newUser;
    });
  }

  async login(data: LoginDto, res: Response) {
    // 1. Tìm user theo username
    const user = await this.prisma.user.findUnique({
      where: { username: data.username },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException("Tài khoản không tồn tại hoặc bị khóa");
    }

    let profile: any = null;
    if (user.staffId) {
      profile = await this.prisma.staff.findUnique({
        where: { id: user.staffId! },
        include: {
          department: true,
        },
      });
    } else if (user.studentId) {
      profile = await this.prisma.student.findUnique({
        where: { id: user.studentId! },
      });
    }

    // 2. Kiểm tra password
    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException("Mật khẩu không chính xác");
    }

    // 3. Tạo Payload và ký JWT
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: "1h" }),
      this.jwtService.signAsync(payload, { expiresIn: "7d" }),
    ]);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/auth/refresh",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    });

    return res.status(200).json({
      access_token: accessToken,

      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        profile: profile || undefined,
      },
    });
  }

  async refreshToken(refreshToken: string, res: Response) {
    if (!refreshToken)
      throw new UnauthorizedException("Refresh token không được cung cấp");

    try {
      const payload = await this.jwtService.verifyAsync(refreshToken);

      const newPayload = {
        sub: payload.sub,
        username: payload.username,
        role: payload.role,
      };
      const newAccessToken = await this.jwtService.signAsync(newPayload, {
        expiresIn: "1h",
      });

      return res.status(200).json({
        access_token: newAccessToken,
      });
    } catch (err) {
      console.log("Lỗi khi xác minh refresh token:", err);
      throw new UnauthorizedException("Refresh token không hợp lệ");
    }
  }

  async getAllAccount(query: SearchAccountDto) {
    const whereClause: any = {};

    if (query.role) {
      whereClause.role = query.role;
    }

    const result = await this.prisma.user.findMany({
      where: whereClause,
    });

    return plainToInstance(AccountResponseDto, result);
  }
}
