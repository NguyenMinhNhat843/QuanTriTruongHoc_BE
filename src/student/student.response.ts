import { ApiProperty } from "@nestjs/swagger";
import {
  StudentStatus,
  RoleType,
} from "../../prisma/generated/prisma/enums.js";
import { Student } from "../../prisma/generated/prisma/client";

export class StudentResponseDto implements Student {
  @ApiProperty()
  id: number;

  @ApiProperty()
  studentCode: string;

  @ApiProperty({ nullable: true })
  userId: number | null;

  // --- Thông tin từ quan hệ User ---
  @ApiProperty({ example: "nguyenvana" })
  username: string;

  @ApiProperty({ example: "Nguyễn Văn A" })
  fullName: string | null;

  @ApiProperty({ example: "student@school.edu.vn" })
  email: string | null;

  @ApiProperty({
    type: Boolean,
    example: true,
    description: "true: Nam, false: Nữ",
  })
  gender: boolean | null;

  @ApiProperty({
    type: Date, // Xác định rõ kiểu dữ liệu là Date
    nullable: true, // Cho phép giá trị null trong tài liệu API
    required: false, // Nếu trường này không bắt buộc gửi lên
    example: "2000-01-01",
  })
  dob: Date | null;

  @ApiProperty()
  phone: string | null;

  @ApiProperty()
  avatarUrl: string | null;

  @ApiProperty({ example: "123 Đường ABC, Nha Trang" })
  address: string | null;

  @ApiProperty({ enum: RoleType })
  role: RoleType;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  applicationId: number | null;

  // --- Thông tin riêng của Student ---
  @ApiProperty()
  classId: number | null;

  @ApiProperty()
  enrollmentDate: Date | null;

  @ApiProperty()
  graduationDate: Date | null;

  @ApiProperty({ enum: StudentStatus })
  status: StudentStatus;

  @ApiProperty()
  parentName: string | null;

  @ApiProperty()
  parentPhone: string | null;

  @ApiProperty()
  identityNumber: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  batchId: number | null;

  @ApiProperty()
  majorId: number | null;

  constructor(partial: Partial<StudentResponseDto>) {
    Object.assign(this, partial);
  }
}
