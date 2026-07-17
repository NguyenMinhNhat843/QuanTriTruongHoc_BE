import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNotEmpty } from "class-validator";

export class ImportAssessmentDto {
  @ApiProperty({
    type: "string",
    format: "binary",
    description: "File Excel danh sách điểm rèn luyện tổng hợp (.xlsx)",
  })
  file: any;

  @ApiProperty({
    type: "integer",
    description: "ID của Đợt Đánh Giá (EvaluationPeriod)",
    example: 1,
  })
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value, 10))
  periodId: number;
}
