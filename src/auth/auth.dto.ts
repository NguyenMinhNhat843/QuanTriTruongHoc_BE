import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { RoleType } from "../../prisma/generated/prisma/enums";
import { Type } from "class-transformer";

export class LoginDto {
  @ApiProperty({ example: "admin" })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @ApiProperty({ example: "123456" })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class SearchAccountDto {
  @ApiPropertyOptional({ enum: RoleType })
  @IsOptional()
  @IsEnum(RoleType, {
    message: "role phải là admin, teacher, staff, student",
  })
  role?: RoleType;
}

export class RegisterDto {
  @ApiProperty({ example: "newuser" })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @ApiPropertyOptional({ type: Number })
  @Type(() => Number)
  @IsOptional()
  studentId?: number;

  @ApiPropertyOptional({ type: Number })
  @Type(() => Number)
  @IsOptional()
  staffId?: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ enum: RoleType })
  @IsEnum(RoleType)
  role: RoleType;
}
