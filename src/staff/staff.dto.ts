import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEmail,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  Min,
} from "class-validator";
import { EmployeeRole } from "../../prisma/generated/prisma/enums";
import { Exclude, Type } from "class-transformer";
import { Staff } from "../../prisma/generated/prisma/client";

export class CreateStaffDto implements Staff {
  @ApiPropertyOptional()
  @IsOptional()
  id: number;

  // --- Thông tin cá nhân (Staff) ---
  @ApiProperty({ example: "Nguyễn Văn C" })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({ example: "1990-01-01" })
  @IsDateString()
  @IsNotEmpty()
  dob: Date;

  @ApiPropertyOptional({ enum: EmployeeRole })
  @IsOptional()
  @IsEnum(EmployeeRole)
  EmployeeRole: EmployeeRole;

  @ApiPropertyOptional({ type: String, example: "staff@school.edu.vn" })
  @IsEmail()
  @IsOptional()
  email: string;

  @ApiPropertyOptional({ type: String, example: "0901234567" })
  @IsString()
  @IsOptional()
  phone: string;

  @ApiPropertyOptional({ type: String, example: "0251369874" })
  @IsString()
  @IsOptional()
  identityNumber: string | null;

  @ApiPropertyOptional({ type: Boolean, description: "true: Nam, false: Nữ" })
  @IsBoolean()
  @IsOptional()
  gender: boolean | null;

  @ApiPropertyOptional({
    description: "Mã số nhân viên (duy nhất)",
  })
  @IsOptional()
  @IsString()
  staffCode: string;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
  })
  @IsInt()
  @IsOptional()
  userId: number | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  @IsString()
  @IsOptional()
  position: string | null;

  @ApiPropertyOptional({
    nullable: true,
    type: String,
  })
  @IsString()
  @IsOptional()
  address: string;

  @ApiPropertyOptional({
    nullable: true,
    type: String,
  })
  @IsString()
  @IsOptional()
  avatarUrl: string | null;

  @ApiPropertyOptional({
    nullable: true,
    type: String,
  })
  @IsString()
  @IsOptional()
  contractType: string | null;

  @ApiPropertyOptional({
    nullable: true,
    type: Number,
  })
  @IsInt()
  @IsOptional()
  departmentId: number | null;

  @ApiPropertyOptional({
    nullable: true,
    type: Boolean,
  })
  @IsBoolean()
  @IsOptional()
  isTeacher: boolean | null;

  @ApiPropertyOptional({
    nullable: true,
    type: Number,
  })
  @IsOptional()
  salaryCoefficient: number | null; // Hệ số lương

  @ApiPropertyOptional({
    nullable: true,
    type: String,
  })
  @IsDateString()
  @IsOptional()
  hireDate: Date | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  createdAt: Date;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  updatedAt: Date;
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

  @ApiPropertyOptional({ enum: EmployeeRole })
  @IsOptional()
  @IsEnum(EmployeeRole)
  employeeRole?: EmployeeRole;

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
