import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Subject } from "../../prisma/generated/prisma/client";
import { IsOptional } from "class-validator";

export class SubjectResponseDto implements Subject {
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

  @ApiPropertyOptional({ type: Number })
  testHours: number;

  @ApiProperty({ example: 1 })
  deptId: number;

  @ApiPropertyOptional({
    example: "Mô tả môn học",
    nullable: true,
    type: String,
  })
  description: string | null;

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

  @ApiPropertyOptional()
  @IsOptional()
  departmentId: number | null;
}
