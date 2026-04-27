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

  @ApiProperty()
  userId: number;

  // --- Thông tin từ quan hệ User ---
  @ApiProperty({ example: "nguyenvana" })
  username: string;

  @ApiProperty({ example: "Nguyễn Văn A" })
  fullName: string | null;

  @ApiProperty({ example: "student@school.edu.vn" })
  email: string | null;

  @ApiProperty({ example: true, description: "true: Nam, false: Nữ" })
  gender: boolean | null;

  @ApiProperty()
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

  constructor(student: any) {
    this.id = student.id;
    this.studentCode = student.studentCode;
    this.userId = student.userId;

    // Ánh xạ dữ liệu từ quan hệ 'user' nếu có
    if (student.user) {
      this.username = student.user.username;
      this.role = student.user.role;
      this.isActive = student.user.isActive;
    }

    this.classId = student.classId;
    this.enrollmentDate = student.enrollmentDate;
    this.graduationDate = student.graduationDate;
    this.status = student.status;
    this.parentName = student.parentName;
    this.parentPhone = student.parentPhone;
    this.identityNumber = student.identityNumber;
    this.fullName = student.fullName;
    this.email = student.email;
    this.gender = student.gender;
    this.dob = student.dob;
    this.phone = student.phone;
    this.address = student.address;
    this.createdAt = student.createdAt;
    this.updatedAt = student.updatedAt;
    this.batchId = student.batchId;
    this.majorId = student.majorId;
  }
}
