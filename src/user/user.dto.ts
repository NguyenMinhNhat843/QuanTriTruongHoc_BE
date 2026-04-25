import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
} from "class-validator";
import { RoleType } from "../../prisma/generated/prisma/enums.js";

export class CreateUserDto {
  @ApiProperty({ example: "johndoe", description: "Tên đăng nhập duy nhất" })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @ApiProperty({
    example: "hashed_password_123",
    description: "Mật khẩu đã mã hóa",
  })
  @IsString()
  @IsNotEmpty()
  passwordHash!: string;

  @ApiProperty({ enum: RoleType, description: "Vai trò của người dùng" })
  @IsEnum(RoleType)
  @IsNotEmpty()
  role!: RoleType;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  // Bạn có thể ghi đè hoặc thêm các trường không cho phép sửa khi update tại đây
  // Ví dụ: Không cho phép cập nhật lại username hoặc role qua API thông thường
}
