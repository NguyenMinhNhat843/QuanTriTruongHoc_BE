import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  handleRequest(err: any, user: any) {
    // Nếu có lỗi hoặc không có user (token sai/hết hạn)
    if (err || !user) {
      throw (
        err || new UnauthorizedException("Bạn chưa đăng nhập hoặc có lỗi j đó")
      );
    }
    return user;
  }
}
