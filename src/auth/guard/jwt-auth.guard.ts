import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  handleRequest(err: any, user: any, info: any) {
    console.log("--- DEBUG JWT GUARD ---");
    console.log("Error inside Passport:", err);
    console.log("User object decoded:", user);
    console.log("Passport Info (Lý do lỗi):", info?.message);
    console.log("------------------------");
    console.log("user: ", user);
    // Nếu có lỗi hoặc không có user (token sai/hết hạn)
    if (err || !user) {
      throw (
        err || new UnauthorizedException("Bạn chưa đăng nhập hoặc có lỗi j đó")
      );
    }
    return user;
  }
}
