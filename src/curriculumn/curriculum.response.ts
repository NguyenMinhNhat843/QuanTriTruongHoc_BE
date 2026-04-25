import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CurriculumResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "CTK-CNTT-2023" })
  curriculumCode: string;

  @ApiProperty({ example: "Chương trình khung Công nghệ thông tin 2023" })
  curriculumName: string;

  @ApiProperty({ example: 1 })
  majorId: number;

  @ApiProperty({ example: 1 })
  version: number;

  @ApiProperty({ example: 120 })
  totalCredits: number;

  @ApiPropertyOptional({ example: "2023-09-01", nullable: true })
  effectiveFrom?: Date;

  @ApiPropertyOptional({ example: "2027-09-01", nullable: true })
  effectiveTo?: Date;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: "2024-04-25T10:00:00Z" })
  createdAt: Date;

  @ApiProperty({ example: "2024-04-25T10:00:00Z" })
  updatedAt: Date;

  // --- Dữ liệu quan hệ ---
  @ApiPropertyOptional({ description: "Thông tin ngành đào tạo" })
  major?: any;

  @ApiPropertyOptional({
    example: 40,
    description: "Số lượng môn học trong chương trình",
  })
  subjectCount?: number;

  constructor(partial: any) {
    this.id = partial.id;
    this.curriculumCode = partial.curriculumCode;
    this.curriculumName = partial.curriculumName;
    this.majorId = partial.majorId;
    this.version = partial.version;
    this.totalCredits = partial.totalCredits;
    this.effectiveFrom = partial.effectiveFrom;
    this.effectiveTo = partial.effectiveTo;
    this.isActive = partial.isActive;
    this.createdAt = partial.createdAt;
    this.updatedAt = partial.updatedAt;

    // Map quan hệ Major nếu có include
    if (partial.major) {
      this.major = partial.major;
    }

    // Map số lượng môn học từ Prisma _count (nếu có dùng include trong service)
    if (partial._count) {
      this.subjectCount = partial._count.curriculumSubjects;
    }
  }
}
