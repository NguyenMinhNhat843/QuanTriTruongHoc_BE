// create-course-registration.dto.ts
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateCourseRegistrationDto {
  @ApiProperty({ example: 1, description: "ID của Sinh viên" })
  @IsInt()
  @IsNotEmpty()
  studentId: number;

  @ApiProperty({ example: 1, description: "ID của Lớp học phần" })
  @IsInt()
  @IsNotEmpty()
  courseOfferId: number;

  @ApiPropertyOptional({
    example: "Đăng ký học cải thiện điểm",
    description: "Ghi chú",
  })
  @IsString()
  @IsOptional()
  note?: string;
}
