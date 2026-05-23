import { ApiPropertyOptional } from "@nestjs/swagger";
import { UserResponseDto } from "../user/user.response.js";
import { CreateStaffDto } from "./staff.dto.js";

export class StaffResponseDto extends CreateStaffDto {
  @ApiPropertyOptional({ type: UserResponseDto })
  user?: UserResponseDto;
}
