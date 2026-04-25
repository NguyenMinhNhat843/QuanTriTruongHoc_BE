import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class DepartmentResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({
    example: "IT01",
    description: "Mã định danh duy nhất của khoa/phòng",
  })
  deptCode: string;

  @ApiProperty({ example: "Khoa Công nghệ thông tin" })
  deptName: string;

  @ApiPropertyOptional({
    example: "Chuyên đào tạo lập trình viên và kỹ sư hệ thống",
    nullable: true,
  })
  description?: string;

  @ApiPropertyOptional({
    example: 1,
    description: "ID của nhân viên làm trưởng khoa",
    nullable: true,
  })
  headOfDepartmentId?: number;

  @ApiProperty({ example: "2024-04-25T10:00:00Z" })
  createdAt: Date;

  @ApiProperty({ example: "2024-04-25T10:00:00Z" })
  updatedAt: Date;

  // --- Dữ liệu quan hệ (chỉ xuất hiện khi dùng include) ---
  @ApiPropertyOptional({
    example: 5,
    description: "Số lượng ngành học trực thuộc",
  })
  majorCount?: number;

  @ApiPropertyOptional({
    example: 20,
    description: "Số lượng môn học trực thuộc",
  })
  subjectCount?: number;

  constructor(partial: any) {
    // 1. Gán các trường cơ bản từ Department [cite: 219]
    this.id = partial.id;
    this.deptCode = partial.deptCode;
    this.deptName = partial.deptName;
    this.description = partial.description;
    this.headOfDepartmentId = partial.headOfDepartmentId;
    this.createdAt = partial.createdAt;
    this.updatedAt = partial.updatedAt;

    // 2. Map dữ liệu thống kê từ Prisma _count (nếu có) [cite: 235]
    if (partial._count) {
      this.majorCount = partial._count.majors;
      this.subjectCount = partial._count.subjects;
    }
  }
}
