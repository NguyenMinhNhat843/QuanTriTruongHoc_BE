import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { RoleType } from "../../prisma/generated/prisma/enums.js";

export class StaffResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "STF001" })
  staffCode: string;

  // --- Dữ liệu lấy từ User ---
  @ApiProperty({ example: "staff_account" })
  username: string;

  @ApiProperty({ enum: RoleType })
  role: RoleType;

  @ApiProperty({ example: true })
  isActive: boolean;

  // --- Dữ liệu cá nhân ---
  @ApiPropertyOptional({ example: "Nguyễn Văn C" })
  fullName?: string;

  @ApiPropertyOptional({ example: "staff@school.edu.vn" })
  email?: string;

  @ApiPropertyOptional({ example: true })
  gender?: boolean;

  @ApiPropertyOptional({ example: "1990-01-01" })
  dob?: Date;

  @ApiPropertyOptional({ example: "0901234567" })
  phone?: string;

  @ApiPropertyOptional({ example: "123 Đường ABC, Nha Trang" })
  address?: string;

  @ApiPropertyOptional({ example: "056205001234" })
  identityNumber?: string;

  // --- Dữ liệu công việc ---
  @ApiPropertyOptional({ example: 1 })
  departmentId?: number;

  @ApiPropertyOptional({ example: "Kế toán trưởng" })
  position?: string;

  @ApiPropertyOptional({ example: "2024-01-15" })
  hireDate?: Date;

  @ApiPropertyOptional({ example: "Full-time" })
  contractType?: string;

  @ApiProperty({ example: "2024-04-25T10:00:00Z" })
  createdAt: Date;

  constructor(partial: any) {
    // 1. Gán các trường cơ bản từ Staff
    this.id = partial.id;
    this.staffCode = partial.staffCode;
    this.fullName = partial.fullName;
    this.email = partial.email;
    this.gender = partial.gender;
    this.dob = partial.dob;
    this.phone = partial.phone;
    this.address = partial.address;
    this.identityNumber = partial.identityNumber;
    this.departmentId = partial.departmentId;
    this.position = partial.position;
    this.hireDate = partial.hireDate;
    this.contractType = partial.contractType;
    this.createdAt = partial.createdAt;

    // 2. Map dữ liệu từ quan hệ User (nếu có include)
    if (partial.user) {
      this.username = partial.user.username;
      this.role = partial.user.role;
      this.isActive = partial.user.isActive;
    }
  }
}
