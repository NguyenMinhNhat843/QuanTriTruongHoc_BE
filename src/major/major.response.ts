import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { DepartmentResponseDto } from "../department/department.response";
import { Major } from "../../prisma/generated/prisma/client";

export class MajorResponseDto implements Readonly<Major> {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "CNTT" })
  majorCode: string;

  @ApiProperty({ example: "Công nghệ thông tin" })
  majorName: string;

  @ApiProperty({ example: 1 })
  deptId: number;

  @ApiProperty({ example: 90 })
  totalCredits: number;

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

  @ApiPropertyOptional({
    example: "Ngành học tập trung vào phát triển phần mềm",
    description: "Mô tả chi tiết về ngành học",
  })
  description: string | null;

  constructor(partial: any) {
    this.id = partial.id;
    this.majorCode = partial.majorCode;
    this.majorName = partial.majorName;
    this.deptId = partial.deptId;
    this.totalCredits = partial.totalCredits;
    this.createdAt = partial.createdAt;
    this.updatedAt = partial.updatedAt;
    this.description = partial.description;

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
