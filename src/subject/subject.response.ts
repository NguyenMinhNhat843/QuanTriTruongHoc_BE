import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class SubjectResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "BAS1201" })
  subjectCode: string;

  @ApiProperty({ example: "Lập trình hướng đối tượng" })
  subjectName: string;

  @ApiProperty({ example: 3 })
  credits: number;

  @ApiProperty({ example: 30 })
  theoryHours: number;

  @ApiProperty({ example: 15 })
  practiceHours: number;

  @ApiProperty({ example: 1 })
  deptId: number;

  @ApiProperty({ example: true })
  isMandatory: boolean;

  @ApiPropertyOptional({ example: "Mô tả môn học", nullable: true })
  description?: string;

  @ApiProperty({ example: "2024-04-25T10:00:00Z" })
  createdAt: Date;

  @ApiProperty({ example: "2024-04-25T10:00:00Z" })
  updatedAt: Date;

  // --- Dữ liệu quan hệ ---
  @ApiPropertyOptional({ description: "Thông tin khoa quản lý" })
  department?: any;

  @ApiPropertyOptional({
    example: 5,
    description: "Số lượng chương trình đào tạo có môn này",
  })
  curriculumCount?: number;

  constructor(partial: any) {
    this.id = partial.id;
    this.subjectCode = partial.subjectCode;
    this.subjectName = partial.subjectName;
    this.credits = partial.credits;
    this.theoryHours = partial.theoryHours;
    this.practiceHours = partial.practiceHours;
    this.deptId = partial.deptId;
    this.isMandatory = partial.isMandatory;
    this.description = partial.description;
    this.createdAt = partial.createdAt;
    this.updatedAt = partial.updatedAt;

    // Map quan hệ Department nếu có include
    if (partial.department) {
      this.department = partial.department;
    }

    // Map số lượng quan hệ từ Prisma _count
    if (partial._count) {
      this.curriculumCount = partial._count.curriculumnSubject;
    }
  }
}
