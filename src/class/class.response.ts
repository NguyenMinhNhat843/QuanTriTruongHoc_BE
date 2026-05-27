import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { MajorResponseDto } from "../major/major.response";
import { StaffResponseDto } from "../staff/staff.response";
import { BatchResponseDto } from "../batch/batch.response";
import { Class } from "../../prisma/generated/prisma/client";

export class ClassResponseDto implements Class {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "CNTT17A" })
  classCode: string;

  @ApiProperty({ example: "Lớp Công nghệ thông tin 17A" })
  className: string;

  @ApiProperty({ example: 1 })
  majorId: number;

  @ApiProperty({ example: 2024 })
  courseYear: number;

  @ApiPropertyOptional({ example: 1, nullable: true, type: Number })
  formTeacherId: number | null;

  @ApiProperty({ example: 40 })
  maxStudents: number;

  @ApiProperty({ example: "active" })
  status: string;

  @ApiProperty({ example: "2024-04-25T10:00:00Z" })
  createdAt: Date;

  @ApiProperty({ example: "2024-04-25T10:00:00Z" })
  updatedAt: Date;

  @ApiPropertyOptional({ example: 1, nullable: true, type: Number })
  batchId: number | null;

  @ApiPropertyOptional({
    example: 35,
    description: "Số lượng sinh viên hiện tại",
    type: Number,
  })
  currentSize: number;

  // --- Dữ liệu quan hệ ---
  @ApiPropertyOptional({
    description: "Thông tin ngành đào tạo",
    type: () => MajorResponseDto,
  })
  major?: MajorResponseDto;

  @ApiPropertyOptional({
    description: "Thông tin giáo viên chủ nhiệm",
    type: () => StaffResponseDto,
  })
  formTeacher?: StaffResponseDto;

  @ApiPropertyOptional({
    example: 35,
    description: "Số lượng sinh viên hiện tại",
  })
  studentCount?: number;

  @ApiPropertyOptional({
    description: "Thông tin khóa học (batch)",
    type: () => BatchResponseDto,
  })
  batch?: BatchResponseDto;

  constructor(partial: any = {}) {
    // Thêm = {} ở đây
    if (!partial) return; // Bảo vệ an toàn tuyệt đối
    this.id = partial.id;
    this.classCode = partial.classCode;
    this.className = partial.className;
    this.majorId = partial.majorId;
    this.courseYear = partial.courseYear;
    this.formTeacherId = partial.formTeacherId;
    this.maxStudents = partial.maxStudents;
    this.status = partial.status;
    this.createdAt = partial.createdAt;
    this.updatedAt = partial.updatedAt;
    this.batchId = partial.batchId;

    if (partial.batch) {
      this.batch = partial.batch;
    }

    // Map quan hệ Major
    if (partial.major) {
      this.major = partial.major;
    }

    // Map quan hệ Staff (Giáo viên chủ nhiệm)
    if (partial.formTeacher) {
      this.formTeacher = partial.formTeacher;
    }

    // Map số lượng quan hệ (nếu có dùng _count trong prisma)
    if (partial._count) {
      this.studentCount = partial._count.students; // Giả sử có quan hệ students
    }
  }
}
