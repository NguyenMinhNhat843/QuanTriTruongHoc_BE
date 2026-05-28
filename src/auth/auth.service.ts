import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service.js";
import { LoginDto, RegisterDto, SearchAccountDto } from "./auth.dto.js";
import * as bcrypt from "bcryptjs";
import { plainToInstance } from "class-transformer";
import { AccountResponseDto } from "./auth.resposne.js";

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

    // 1. Tạo người dùng mới
    const hashedPassword = await bcrypt.hash(body.password, 10);
    const newUser = await this.prisma.user.create({
      data: {
        username: body.username,
        passwordHash: hashedPassword,
        role: body.role,
      },
    });

    return newUser;
  }

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

    // 3. Tạo Payload và ký JWT
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
