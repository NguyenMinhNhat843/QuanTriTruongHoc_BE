import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { TeacherSubject } from "../../prisma/generated/prisma/client";
import { IsArray, IsInt, IsNumber, IsOptional } from "class-validator";
import { Type } from "class-transformer";
import { StaffResponseDto } from "./staff.response";
import { SubjectResponseDto } from "../subject/subject.response";

export class TeacherSubjectResponseDto implements TeacherSubject {
  @ApiPropertyOptional({
    example: 12,
    description: "ID tự tăng của bảng trung gian",
  })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  id: number;

  @ApiProperty({
    example: 1,
    description: "ID của Giáo viên",
  })
  @IsNumber()
  @Type(() => Number)
  teacherId: number;

  @ApiProperty({
    example: 5,
    description: "ID của Môn học",
  })
  @IsNumber()
  @Type(() => Number)
  subjectId: number;

  @ApiPropertyOptional({
    example: "2026-05-23T08:30:00.000Z",
    description: "Thời gian tạo bản ghi",
  })
  @IsOptional()
  @Type(() => Date)
  createdAt: Date;

  // Thông tin liên quan (nếu có)
  @ApiPropertyOptional({
    type: () => StaffResponseDto,
    description: "Thông tin giáo viên (nếu có)",
  })
  teacher?: StaffResponseDto;

  @ApiPropertyOptional({
    type: () => SubjectResponseDto,
    description: "Thông tin môn học (nếu có)",
  })
  subject?: SubjectResponseDto;
}

export class CreateTeacherSubjectDto {
  @ApiProperty()
  @IsNumber()
  teacherId: number;

  @ApiProperty()
  @IsNumber()
  subjectId: number;
}

export class UpdateTeacherSubjectDto extends PartialType(
  CreateTeacherSubjectDto,
) {}

export class CreateTeacherSubjectManyDto {
  @ApiProperty({
    description: "ID của giáo viên cần phân công môn học",
    example: 1,
  })
  @IsInt()
  teacherId: number;

  @ApiProperty({
    description: "Danh sách ID của các môn học được chọn",
    type: [Number],
  })
  @IsArray()
  @IsInt({ each: true })
  subjectIds: number[];
}
