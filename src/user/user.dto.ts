import { PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsPhoneNumber,
  IsDateString,
  IsBoolean,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  id!: string;

  @IsString()
  username!: string;

  @IsString()
  password!: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsPhoneNumber('VN')
  @IsOptional()
  phone?: string;

  @IsDateString()
  @IsOptional()
  birthday?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
