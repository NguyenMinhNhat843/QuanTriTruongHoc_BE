import { ApiProperty, PartialType } from "@nestjs/swagger";
import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsString } from "class-validator";
import { Transform } from "class-transformer";
import { GradeSubmissionStatus } from "../../prisma/generated/prisma/enums";

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

// submit-diem.dto.ts
export class SubmitDiemDto {
  @ApiProperty({ example: 5, description: "ID của lớp học phần (CourseOffer)" })
  @IsInt()
  @IsNotEmpty()
  courseOfferId: number;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  createBy: number; // Sau này nếu bạn làm Auth (JWT), ID này sẽ lấy từ Token chứ không cần truyền ở Body.

  @ApiProperty()
  @IsEnum(GradeSubmissionStatus)
  @IsNotEmpty()
  status: GradeSubmissionStatus;
}
