import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { DepartmentResponseDto } from "../department/department.response";

export class MajorResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "CNTT" })
  majorCode: string;

  @ApiProperty({ example: "Công nghệ thông tin" })
  majorName: string;

  @ApiProperty({ example: 1 })
  deptId: number;

  @ApiPropertyOptional({ example: "2.5 năm" })
  durationYears?: string;

  @ApiProperty({ example: 90 })
  totalCredits: number;

  @ApiPropertyOptional({ example: "Mô tả ngành học" })
  description?: string;

  @ApiProperty({ example: "2024-04-25T10:00:00Z" })
  createdAt: Date;

  @ApiProperty({ example: "2024-04-25T10:00:00Z" })
  updatedAt: Date;

  // --- Dữ liệu quan hệ ---
  @ApiPropertyOptional({ type: () => DepartmentResponseDto })
  department?: any;

  @ApiPropertyOptional({
    example: 10,
    description: "Số lượng lớp học thuộc ngành này",
  })
  classCount?: number;

  constructor(partial: any) {
    this.id = partial.id;
    this.majorCode = partial.majorCode;
    this.majorName = partial.majorName;
    this.deptId = partial.deptId;
    this.durationYears = partial.durationYears;
    this.totalCredits = partial.totalCredits;
    this.description = partial.description;
    this.createdAt = partial.createdAt;
    this.updatedAt = partial.updatedAt;

    // Map thông tin phòng ban nếu có include
    if (partial.department) {
      this.department = partial.department;
    }

    // Map số lượng quan hệ từ Prisma _count
    if (partial._count) {
      this.classCount = partial._count.classes;
    }
  }
}
