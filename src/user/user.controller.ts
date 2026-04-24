import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from "@nestjs/swagger"; // Thêm dòng này
import { CreateUserDto, SearchUserDto } from "./user.dto.js";
import { UserService } from "./user.service.js";
import { UserResponseDto } from "./user.response.js";

@ApiTags("users")
@Controller("users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: "Tạo người dùng mới" })
  @ApiResponse({
    status: 201,
    description: "Tạo thành công",
    type: UserResponseDto,
  })
  async createUser(@Body() body: CreateUserDto): Promise<UserResponseDto> {
    return await this.userService.createUser(body);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Cập nhật thông tin người dùng" })
  @ApiParam({ name: "id", description: "ID của người dùng", type: Number })
  @ApiResponse({
    status: 200,
    description: "Cập nhật thành công",
    type: UserResponseDto,
  })
  async updateUser(
    @Body() body: CreateUserDto,
    @Param("id") id: number,
  ): Promise<UserResponseDto> {
    return await this.userService.updateUser(id, body);
  }

  @Get("search")
  @ApiOperation({ summary: "Tìm kiếm và phân trang người dùng" })
  @ApiResponse({
    status: 200,
    description: "Danh sách người dùng và metadata.",
  })
  async findAll(@Query() query: SearchUserDto) {
    return this.userService.searchUsers(query);
  }
}
