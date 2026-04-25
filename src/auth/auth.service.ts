import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service.js";
import { LoginDto } from "./auth.dto.js";
import * as bcrypt from "bcryptjs";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(data: LoginDto) {
    // 1. Tìm user theo username
    const user = await this.prisma.user.findUnique({
      where: { username: data.username },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException("Tài khoản không tồn tại hoặc bị khóa");
    }

    // 2. Kiểm tra password
    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException("Mật khẩu không chính xác");
    }

    // 3. Tạo Pay   load và ký JWT
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }
}
