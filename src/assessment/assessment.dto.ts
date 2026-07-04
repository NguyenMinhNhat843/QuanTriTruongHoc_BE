import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsArray,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class CreatePeriodDto {
  @ApiProperty({ example: "HK1-2026-2027", description: "Tên đợt đánh giá" })
  @IsString()
  @IsNotEmpty({ message: "Tên đợt đánh giá không được để trống" })
  name: string;

  @ApiProperty()
  semesterId: number;
}

export class CreateCriterionDto {
  @ApiProperty({
    example: "Ý thức học tập (Đi học đầy đủ, đúng giờ)",
    description: "Nội dung tiêu chí",
  })
  @IsString()
  @IsNotEmpty({ message: "Nội dung tiêu chí không được để trống" })
  title: string;

  @ApiProperty({ example: 30, description: "Điểm tối đa của tiêu chí này" })
  @IsInt()
  @Min(1, { message: "Điểm tối đa phải lớn hơn 0" })
  maxScore: number;

  @ApiPropertyOptional({ example: 1, description: "Thứ tự sắp xếp hiển thị" })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class AssessmentDetailInput {
  @ApiProperty({ example: 1, description: "ID tiêu chí" })
  @IsInt()
  criterionId: number;

  @ApiProperty({ example: 25, description: "Điểm học sinh tự chấm" })
  @IsInt()
  @Min(0, { message: "Điểm tự chấm không được nhỏ hơn 0" })
  studentScore: number;
}

export class SubmitAssessmentDto {
  @ApiProperty({ example: 1, description: "ID đợt đánh giá" })
  @IsInt()
  periodId: number;

  @ApiProperty({
    type: [AssessmentDetailInput],
    description: "Chi tiết điểm tự chấm theo tiêu chí",
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssessmentDetailInput)
  details: AssessmentDetailInput[];
}

export class TeacherAssessmentDetailInput {
  @ApiProperty({ example: 1, description: "ID tiêu chí" })
  @IsInt()
  criterionId: number;

  @ApiProperty({ example: 24, description: "Điểm GVCN duyệt cuối cùng" })
  @IsInt()
  @Min(0, { message: "Điểm duyệt không được nhỏ hơn 0" })
  teacherScore: number;
}

export class ApproveAssessmentDto {
  @ApiProperty({ example: 1, description: "ID phiếu điểm cần duyệt" })
  @IsInt()
  assessmentId: number;

  @ApiPropertyOptional({
    example: "Học sinh tích cực tham gia các hoạt động",
    description: "Nhận xét của GVCN",
  })
  @IsOptional()
  @IsString()
  teacherComment?: string;

  @ApiProperty({
    type: [TeacherAssessmentDetailInput],
    description: "Chi tiết điểm GVCN chấm theo tiêu chí",
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TeacherAssessmentDetailInput)
  details: TeacherAssessmentDetailInput[];
}
