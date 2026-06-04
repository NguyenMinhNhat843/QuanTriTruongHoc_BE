import { Body, Controller, Param, Patch } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from "@nestjs/swagger"; // Thêm dòng này
import { CreateUserDto } from "./user.dto.js";
import { UserService } from "./user.service.js";
import { UserResponseDto } from "./user.response.js";

@ApiTags("users")
@Controller("users")
export class UserController {
  constructor(private readonly userService: UserService) {}

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
}
