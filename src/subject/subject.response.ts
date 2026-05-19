import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Subject } from "../../prisma/generated/prisma/client";
import { SubjetGradeWeightResponseDtoSimple } from "../grade/grade.response";
import { ValidateNested } from "class-validator";
import { Type } from "class-transformer";

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

  @ApiProperty({ example: 1 })
  deptId: number;

  @ApiProperty({ example: true })
  isMandatory: boolean;

  @ApiPropertyOptional({
    example: "Mô tả môn học",
    nullable: true,
    type: String,
  })
  description: string | null;

  @ApiPropertyOptional({
    example: "1,2,3",
    description:
      "Chuỗi ID của các thành phần điểm (grade components) liên kết với môn học, cách nhau bằng dấu phẩy. Ví dụ: '1,2,3'",
    nullable: true,
    type: String,
  })
  grade_components: string | null;

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

  @ApiProperty({
    type: [SubjetGradeWeightResponseDtoSimple],
    nullable: true,
    description: "Danh sách cấu hình tỷ lệ điểm của môn học",
  })
  @ValidateNested({ each: true })
  @Type(() => SubjetGradeWeightResponseDtoSimple)
  subjectGrades: SubjetGradeWeightResponseDtoSimple[] | null;
}
