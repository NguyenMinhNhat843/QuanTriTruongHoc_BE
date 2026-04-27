import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
} from "class-validator";

export class CreateApplicationDto {
  @ApiProperty({ example: "Nguyễn Văn A", description: "Họ và tên đầy đủ" })
  @IsString()
  @IsNotEmpty({ message: "Họ tên không được để trống" })
  fullName: string;

  @ApiProperty({ example: "nguyenvana@gmail.com" })
  @IsEmail({}, { message: "Email không đúng định dạng" })
  @IsNotEmpty({ message: "Email không được để trống" })
  email: string;

  @ApiProperty({ example: "0905123456", description: "Số điện thoại liên lạc" })
  @IsPhoneNumber("VN", {
    message: "Số điện thoại phải đúng định dạng Việt Nam",
  })
  @IsNotEmpty({ message: "Số điện thoại không được để trống" })
  phone: string;

  @ApiProperty({
    example: 1,
    description: "ID chi tiết tuyển sinh (xác định Ngành và Khóa học)",
  })
  @IsInt()
  @IsNotEmpty({ message: "Phải chọn một nguyện vọng ngành học" })
  admissionItemId: number;
}
