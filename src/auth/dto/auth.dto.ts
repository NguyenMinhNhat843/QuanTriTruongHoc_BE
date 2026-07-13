import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { RoleType } from "../../../prisma/generated/prisma/enums";
import { Type } from "class-transformer";
import { StaffDto } from "../../staff/staff.dto";
import { StudentDto } from "../../student/dto/student.dto";
import { DepartmentDto } from "../../department/department.dto";

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

export class StaffResponseDto extends StaffDto {
  department: DepartmentDto;
}
export class ResponseLoginDto {
  accessToken: string;
  user: {
    id: number;
    username: string;
    role: RoleType;
    profile: StaffResponseDto | StudentDto;
  };
}
