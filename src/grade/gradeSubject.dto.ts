import { ApiProperty } from "@nestjs/swagger";
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  IsArray,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class SubjectGradeDto {
  @ApiProperty({
    example: 2,
    description:
      "ID của loại điểm hệ thống (Ví dụ: 1: Chuyên cần, 2: Giữa kỳ, 3: Cuối kỳ)",
  })
  @IsInt()
  @IsNotEmpty()
  gradeComponentId: number;

  @ApiProperty({
    example: 0.3,
    description:
      "Trọng số điểm (Tỷ lệ phần trăm từ 0.0 đến 1.0. Ví dụ: 0.1 tương đương 10%, 0.3 tương đương 30%)",
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1)
  @IsNotEmpty()
  weight: number;
}

export class CreateSubjectGradeWeightsDto {
  @ApiProperty({
    example: 5,
    description: "ID của môn học (Subject) cần cấu hình đầu điểm",
  })
  @IsInt()
  @IsNotEmpty()
  subjectId: number;

  @ApiProperty({
    type: [SubjectGradeDto],
    description:
      "Danh sách mảng các loại điểm cấu hình và tỷ lệ trọng số đi kèm của môn học",
  })
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SubjectGradeDto)
  gradeComponents: SubjectGradeDto[];
}
