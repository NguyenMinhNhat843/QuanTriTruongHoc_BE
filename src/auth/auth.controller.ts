import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Query,
  Res,
  Req,
} from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import { LoginDto, RegisterDto, SearchAccountDto } from "./auth.dto.js";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { AccountResponseDto } from "./auth.resposne.js";
import { Request, Response } from "express";

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
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    return this.authService.login(loginDto, res);
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Làm mới token" })
  async refreshToken(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies.refreshToken;
    return this.authService.refreshToken(refreshToken, res);
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Đăng xuất khỏi hệ thống" })
  async logout(@Res() res: Response) {
    res.clearCookie("refreshToken", {
      path: "/auth/refresh",
    });

    return res.status(200).json({ message: "Đăng xuất thành công" });
  }

  @Get("accounts")
  @ApiResponse({ status: 200, type: [AccountResponseDto] })
  @ApiOperation({ summary: "Lấy danh sách tất cả tài khoản" })
  async getAllAccount(@Query() query: SearchAccountDto) {
    return this.authService.getAllAccount(query);
  }
}
