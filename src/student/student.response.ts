import { ApiProperty } from "@nestjs/swagger";
import {
  StudentStatus,
  RoleType,
} from "../../prisma/generated/prisma/enums.js";
import { Student } from "../../prisma/generated/prisma/client";
import { BatchResponseDto } from "../batch/batch.response.js";

export class StudentResponseDto implements Student {
  @ApiProperty()
  id: number;

  @ApiProperty()
  studentCode: string;

  @ApiProperty({ type: Number, nullable: true })
  userId: number | null;

  // --- Thông tin từ quan hệ User ---
  @ApiProperty({ type: String, example: "nguyenvana" })
  username: string;

  @ApiProperty({ type: String, example: "Nguyễn Văn A" })
  fullName: string | null;

  @ApiProperty({ type: String, example: "student@school.edu.vn" })
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

  @ApiProperty({ type: String, nullable: true })
  phone: string | null;

  @ApiProperty({ type: String, nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ type: String, example: "123 Đường ABC, Nha Trang" })
  address: string | null;

  @ApiProperty({ enum: RoleType })
  role: RoleType;

  @ApiProperty({ type: Boolean })
  isActive: boolean;

  @ApiProperty({ type: Number, nullable: true })
  applicationId: number | null;

  // --- Thông tin riêng của Student ---
  @ApiProperty({ type: Number, nullable: true })
  classId: number | null;

  @ApiProperty({ type: Date, nullable: true })
  enrollmentDate: Date | null;

  @ApiProperty({ type: Date, nullable: true })
  graduationDate: Date | null;

  @ApiProperty({ enum: StudentStatus })
  status: StudentStatus;

  @ApiProperty({ type: String, nullable: true })
  parentName: string | null;

  @ApiProperty({ type: String, nullable: true })
  parentPhone: string | null;

  @ApiProperty({ type: String, nullable: true })
  identityNumber: string | null;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;

  @ApiProperty({ type: Number, nullable: true })
  batchId: number | null;

  @ApiProperty({ type: () => BatchResponseDto, nullable: true })
  batch: BatchResponseDto | null;

  @ApiProperty({ type: Number, nullable: true })
  majorId: number | null;

  constructor(partial: Partial<StudentResponseDto>) {
    Object.assign(this, partial);
  }
}
