import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsEnum,
  IsArray,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { GradeEntryStatus } from "../../prisma/generated/prisma/enums";

export class CreateGradeEntryDto {
  @ApiProperty({ example: 30, description: "ID của học sinh được nhập điểm" })
  @IsInt()
  @IsNotEmpty()
  studentId: number;

  @ApiProperty({
    example: 1,
    description:
      "ID của thành phần điểm (Ví dụ: 1 là Thường kỳ 1, 3 là Giữa kỳ)",
  })
  @IsInt()
  @IsNotEmpty()
  componentId: number;

  @ApiPropertyOptional({
    example: 8.5,
    nullable: true,
    type: Number,
    description:
      "Điểm số của học sinh (Thang điểm 10, chấp nhận số thập phân). Để null nếu chưa nhập.",
  })
  @IsNumber({ maxDecimalPlaces: 2 }) // Giới hạn tối đa 2 chữ số thập phân
  @Min(0)
  @Max(10)
  @IsOptional()
  score: number | null;

  @ApiPropertyOptional({
    example: GradeEntryStatus.PENDING,
    enum: GradeEntryStatus,
    default: GradeEntryStatus.PENDING,
    description: "Trạng thái lưu trữ của đầu điểm",
  })
  @IsEnum(GradeEntryStatus)
  @IsOptional()
  status?: GradeEntryStatus;
}

export class CreateManyGradeEntriesDto {
  @ApiProperty({ example: 5, description: "ID của lớp học phần (CourseOffer)" })
  @IsInt()
  @IsNotEmpty()
  courseOfferId: number;

  @ApiProperty({
    example: 5,
    description: "ID của giảng viên thực hiện nhập điểm (Staff)",
  })
  @IsInt()
  @IsNotEmpty()
  createdBy: number;

  @ApiProperty({
    type: [CreateGradeEntryDto],
    description: "Danh sách mảng các đầu điểm chi tiết của từng học sinh",
  })
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true }) // Bắt buộc chạy sâu xuống để validate từng item trong mảng
  @Type(() => CreateGradeEntryDto) // Kích hoạt class-transformer để mapping dữ liệu lồng nhau
  grades: CreateGradeEntryDto[];
}
