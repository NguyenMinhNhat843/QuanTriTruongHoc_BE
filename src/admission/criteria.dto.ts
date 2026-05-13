import { ApiProperty } from "@nestjs/swagger";
import { IsNumber } from "class-validator";

export class DeleteCriterionDto {
  @ApiProperty({
    example: 1,
    description: "ID của tiêu chí cần xóa",
  })
  @IsNumber()
  id: number;
}
