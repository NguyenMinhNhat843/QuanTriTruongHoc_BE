import { ApiProperty } from "@nestjs/swagger";
import { RoleType, User } from "../../../prisma/generated/prisma/client";
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";

// 1. Định nghĩa sub-dto cho user trước
export class UserInfoDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  username: string;

  @ApiProperty()
  role: string;

  @ApiProperty({
    required: false,
  })
  profile: any;
}

// 2. Sử dụng trong LoginResponseDto
export class LoginResponseDto {
  @ApiProperty()
  access_token: string;

  @ApiProperty()
  refresh_token: string;

  @ApiProperty({
    type: UserInfoDto,
  })
  user: UserInfoDto;
}

export class AccountResponseDto implements User {
  @ApiProperty()
  @IsEnum(RoleType)
  @IsNotEmpty()
  role: RoleType;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  id: number;

  @ApiProperty()
  @IsDate()
  @IsNotEmpty()
  createdAt: Date;

  @ApiProperty()
  @IsDate()
  @IsOptional()
  deletedAt: Date | null;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;

  @ApiProperty()
  @IsDate()
  @IsOptional()
  lastLoginAt: Date | null;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  passwordHash: string;

  @ApiProperty()
  @IsInt()
  @IsOptional()
  staffId: number | null;

  @ApiProperty()
  @IsInt()
  @IsOptional()
  studentId: number | null;

  @ApiProperty()
  @IsDate()
  @IsNotEmpty()
  updatedAt: Date;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  username: string;
}

export class ResponseRefreshTokenDto {
  @ApiProperty()
  access_token: string;
}
