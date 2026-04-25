import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEmail,
  IsBoolean,
  IsDateString,
  MinLength,
  IsEnum,
  IsInt,
  Min,
} from "class-validator";
import { RoleType } from "../../prisma/generated/prisma/enums";
import { Type } from "class-transformer";

export class CreateStaffDto {
  // --- Thông tin tài khoản (User) ---
  @ApiProperty({ example: "staff01" })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @ApiProperty({ example: "123456" })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({ enum: RoleType })
  @IsOptional()
  @IsEnum(RoleType)
  role?: RoleType;

  // --- Thông tin cá nhân (Staff) ---
  @ApiProperty({ example: "Nguyễn Văn C" })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({ example: "1990-01-01" })
  @IsDateString()
  @IsNotEmpty()
  dob!: Date;

  @ApiPropertyOptional({ example: "staff@school.edu.vn" })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: "0901234567" })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: "0251369874" })
  @IsString()
  identityNumber!: string;

  @ApiPropertyOptional({ example: true, description: "true: Nam, false: Nữ" })
  @IsBoolean()
  @IsOptional()
  gender?: boolean;
}

export class UpdateStaffDto extends PartialType(CreateStaffDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  departmentId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  position?: string;
}

export class SearchStaffDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: "Tìm theo tên, mã NV, username, email, CCCD",
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ enum: RoleType })
  @IsOptional()
  @IsEnum(RoleType)
  role?: RoleType;

  @ApiPropertyOptional({ description: "Lọc theo trạng thái tài khoản" })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: "Lọc theo phòng ban" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  departmentId?: number;

  @ApiPropertyOptional({ description: "Lọc theo chức vụ" })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ default: "createdAt" })
  @IsOptional()
  @IsString()
  sortBy?: string = "createdAt";

  @ApiPropertyOptional({ enum: ["asc", "desc"], default: "desc" })
  @IsOptional()
  @IsEnum(["asc", "desc"])
  sortOrder?: "asc" | "desc" = "desc";
}
