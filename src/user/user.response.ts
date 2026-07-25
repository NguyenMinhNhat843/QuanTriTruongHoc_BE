import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";
import { RoleType } from "../../prisma/generated/prisma/enums.js";
import { User } from "../../prisma/generated/prisma/client.js";
import { IsOptional } from "class-validator";
import { StaffDto } from "../staff/dto/staff.dto.js";
import { StudentDetailDto } from "../student/dtos/student.response.js";

export class UserResponseDto implements User {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  staffId: number | null;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  studentId: number | null;

  @ApiProperty({ example: "u_9b1deb4d" })
  @Expose()
  userId: string;

  @ApiProperty({ example: "johndoe" })
  @Expose()
  username: string;

  @ApiProperty({ enum: RoleType })
  @Expose()
  role: RoleType;

  @ApiProperty()
  @Expose()
  isActive: boolean;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  // Ẩn hoàn toàn passwordHash dù nó có tồn tại trong object input
  @Exclude()
  passwordHash: string;

  @Exclude()
  deletedAt: Date | null;

  @ApiPropertyOptional({ example: "2024-01-01T12:00:00Z" })
  lastLoginAt: Date | null;
}

export class ResponseStaffDto extends StaffDto {}
export class ResponseUserWithRelationDto extends UserResponseDto {
  @ApiPropertyOptional({ type: () => StudentDetailDto })
  student?: StudentDetailDto;

  @ApiPropertyOptional({ type: () => ResponseStaffDto })
  staff?: ResponseStaffDto;
}
