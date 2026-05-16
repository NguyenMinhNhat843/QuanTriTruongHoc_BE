import { ApiProperty, PartialType } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { Transform } from "class-transformer";

// --- 1. DTO CHO PATH PARAMETERS (ID) ---
export class GradeComponentParamDto {
  @ApiProperty({ example: 1, description: "ID của loại điểm" })
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  id: number;
}

// --- 2. DTO CHO API TẠO MỚI (CREATE) ---
export class CreateGradeComponentDto {
  @ApiProperty({
    example: "midterm",
    description:
      "Tên thành phần điểm (attendance, midterm, final, assignment...)",
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}

// --- 3. DTO CHO API CẬP NHẬT (UPDATE) ---
export class UpdateGradeComponentDto extends PartialType(
  CreateGradeComponentDto,
) {}
