import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNotEmpty, IsString, IsInt, IsOptional, Min } from "class-validator";

export class EnrollmentPaymentDto {
  @ApiProperty({ example: "SV20260001", description: "Mã số sinh viên" })
  @IsString({ message: "Mã sinh viên phải là chuỗi ký tự" })
  @IsNotEmpty({ message: "Mã sinh viên không được để trống" })
  studentCode: string;

  @ApiProperty({ example: 1, description: "ID của ngành học (Major)" })
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  majorId: number;

  @ApiProperty({ example: 1, description: "ID của khóa học (Batch)" })
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  batchId: number;

  @ApiProperty({
    example: 1,
    description: "Học kỳ đóng tiền (Mặc định là 1 cho nhập học)",
  })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  @Type(() => Number)
  semester: number;

  @ApiProperty({
    example: "Chuyển khoản ngân hàng",
    description: "Phương thức thanh toán",
    required: false,
  })
  @IsOptional()
  @IsString()
  paymentMethod?: string;
}
