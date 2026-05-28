import { ApiProperty } from "@nestjs/swagger";
import { RoleType, User } from "../../prisma/generated/prisma/client";
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";

export class LoginResponseDto {
  @ApiProperty()
  access_token: string;

  @ApiProperty()
  user: {
    id: number;
    username: string;
    role: string;
  };
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
