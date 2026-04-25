import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CurriculumSubjectResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  curriculumId: number;

  @ApiProperty({ example: 1 })
  subjectId: number;

  @ApiProperty({ example: 1 })
  semesterNumber: number;

  @ApiProperty({ example: true })
  isMandatory: boolean;

  @ApiProperty({ example: 5.0 })
  minGrade: number;

  @ApiProperty({ example: "2024-04-25T10:00:00Z" })
  createdAt: Date;

  // --- Dữ liệu quan hệ (Thường dùng nhất là thông tin môn học) ---
  @ApiPropertyOptional({ description: "Thông tin chi tiết môn học" })
  subject?: any;

  @ApiPropertyOptional({ description: "Thông tin chương trình khung" })
  curriculum?: any;

  constructor(partial: any) {
    this.id = partial.id;
    this.curriculumId = partial.curriculumId;
    this.subjectId = partial.subjectId;
    this.semesterNumber = partial.semesterNumber;
    this.isMandatory = partial.isMandatory;
    this.minGrade = partial.minGrade;
    this.createdAt = partial.createdAt;

    // Map dữ liệu môn học nếu có include trong Prisma
    if (partial.subject) {
      this.subject = partial.subject;
    }

    // Map dữ liệu chương trình nếu có include
    if (partial.curriculum) {
      this.curriculum = partial.curriculum;
    }
  }
}
