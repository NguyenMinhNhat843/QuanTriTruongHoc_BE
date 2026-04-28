import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsOptional,
  Min,
  IsArray,
  ArrayNotEmpty,
} from "class-validator";

export class CreateTuitionFeesDto {
  studentCode;
}

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

export class PayTuitionFeeDto {
  @ApiProperty({
    description: "ID của sinh viên thực hiện thanh toán",
    example: 123,
  })
  @IsNotEmpty()
  @IsInt()
  studentId: number;

  @ApiProperty({
    description:
      "Danh sách ID của các mục thanh toán (ví dụ: ID đăng ký học phần)",
    example: [1, 2, 5],
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty() // Đảm bảo mảng không trống
  @IsInt({ each: true }) // Kiểm tra từng phần tử trong mảng phải là số nguyên
  itemsPaymented: number[];

  @ApiProperty({
    description: "ID của học kỳ thực hiện thanh toán",
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  semesterId: number;
}
