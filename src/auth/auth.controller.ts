import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
} from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import { LoginDto } from "./auth.dto.js";
import { ApiTags, ApiOperation } from "@nestjs/swagger";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Đăng nhập vào hệ thống" })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get("accounts")
  @ApiOperation({ summary: "Lấy danh sách tất cả tài khoản" })
  async getAllAccount() {
    return this.authService.getAllAccount();
  }
}
