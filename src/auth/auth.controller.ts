import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Query,
} from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import { LoginDto, RegisterDto, SearchAccountDto } from "./auth.dto.js";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { AccountResponseDto } from "./auth.resposne.js";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("register")
  @ApiOperation({ summary: "Đăng ký tài khoản mới" })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Đăng nhập vào hệ thống" })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get("accounts")
  @ApiResponse({ status: 200, type: [AccountResponseDto] })
  @ApiOperation({ summary: "Lấy danh sách tất cả tài khoản" })
  async getAllAccount(@Query() query: SearchAccountDto) {
    return this.authService.getAllAccount(query);
  }
}
