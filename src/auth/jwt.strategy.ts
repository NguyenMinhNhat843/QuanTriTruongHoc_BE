import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      // Lấy token từ header Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || "SECRET_KEY_NAM_2026",
    });
  }

  // Payload là dữ liệu ta đã ký khi Login (sub, username, role)
  async validate(payload: any) {
    // Kiểm tra user còn tồn tại và đang hoạt động không
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException("Tài khoản không hợp lệ");
    }

    // Những gì return ở đây sẽ nằm trong request.user
    return {
      id: user.id,
      username: user.username,
      role: user.role,
    };
  }
}
