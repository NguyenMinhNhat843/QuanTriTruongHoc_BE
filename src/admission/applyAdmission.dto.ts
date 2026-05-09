import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsInt,
  IsObject,
  IsOptional,
} from "class-validator";

export class ApplyApplicationDto {
  @ApiProperty({ example: "Nguyễn Văn A" })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: "nguyenvana@gmail.com" })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: "0905123456" })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    example: 10,
    description: "ID của AdmissionItem (Ngành muốn thi vào)",
  })
  @IsInt()
  @IsNotEmpty()
  admissionItemId: number;

  @ApiProperty({
    example: { math_score: 8.5, english_score: 7.0, ielts: 6.5 },
    description: "Dữ liệu điểm số/chứng chỉ dạng JSON",
  })
  @IsObject()
  @IsOptional()
  rawdata: any;
}
