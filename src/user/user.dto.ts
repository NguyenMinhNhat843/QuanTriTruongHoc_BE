import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsDateString,
  IsInt,
  Min,
} from "class-validator";
import { RoleType } from "../../prisma/generated/prisma/enums.js";
import { Type } from "class-transformer";

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

  @ApiPropertyOptional({ example: "user@example.com" })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: "Nguyen Van A" })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ example: true, description: "true: Nam, false: Nữ" })
  @IsBoolean()
  @IsOptional()
  gender?: boolean;

  @ApiPropertyOptional({ example: "1995-01-01", description: "Ngày sinh" })
  @IsDateString()
  @IsOptional()
  dob?: Date;

  @ApiPropertyOptional({ example: "0901234567" })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: "https://avatar.com/image.png" })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  // Bạn có thể ghi đè hoặc thêm các trường không cho phép sửa khi update tại đây
  // Ví dụ: Không cho phép cập nhật lại username hoặc role qua API thông thường
}

export class SearchUserDto {
  // --- PHÂN TRANG (PAGINATION) ---
  @ApiPropertyOptional({ description: "Số trang hiện tại", default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: "Số lượng bản ghi trên mỗi trang",
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  // --- TÌM KIẾM & LỌC (FILTERING) ---
  @ApiPropertyOptional({
    description: "Tìm kiếm theo username, email hoặc họ tên",
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: "Lọc theo vai trò", enum: RoleType })
  @IsOptional()
  @IsEnum(RoleType)
  role?: RoleType;

  @ApiPropertyOptional({ description: "Trạng thái hoạt động" })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiPropertyOptional({ description: "Giới tính (true: Nam, false: Nữ)" })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  gender?: boolean;

  @ApiPropertyOptional({
    description: "Lọc người dùng tạo từ ngày (YYYY-MM-DD)",
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    description: "Lọc người dùng tạo đến ngày (YYYY-MM-DD)",
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  // --- SẮP XẾP (SORTING) ---
  @ApiPropertyOptional({
    description: "Trường cần sắp xếp",
    default: "createdAt",
  })
  @IsOptional()
  @IsString()
  sortBy?: string = "createdAt";

  @ApiPropertyOptional({
    description: "Hướng sắp xếp",
    enum: ["asc", "desc"],
    default: "desc",
  })
  @IsOptional()
  @IsEnum(["asc", "desc"])
  sortOrder?: "asc" | "desc" = "desc";
}
