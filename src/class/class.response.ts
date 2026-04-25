import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ClassResponseDto {
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

  @ApiPropertyOptional({ example: 1, nullable: true })
  formTeacherId?: number;

  @ApiProperty({ example: 40 })
  maxStudents: number;

  @ApiProperty({ example: "active" })
  status: string;

  @ApiProperty({ example: "2024-04-25T10:00:00Z" })
  createdAt: Date;

  @ApiProperty({ example: "2024-04-25T10:00:00Z" })
  updatedAt: Date;

  // --- Dữ liệu quan hệ ---
  @ApiPropertyOptional({ description: "Thông tin ngành đào tạo" })
  major?: any;

  @ApiPropertyOptional({ description: "Thông tin giáo viên chủ nhiệm" })
  formTeacher?: any;

  @ApiPropertyOptional({
    example: 35,
    description: "Số lượng sinh viên hiện tại",
  })
  studentCount?: number;

  constructor(partial: any) {
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
