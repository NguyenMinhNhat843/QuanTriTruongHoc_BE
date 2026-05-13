import { ApiProperty } from "@nestjs/swagger";
import { ApplycationAdmissionStatus } from "../../prisma/generated/prisma/enums";
import { AdmissionItemResponseDto } from "./admission.response";

export class ApplicationResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "Nguyễn Văn A" })
  fullName: string;

  @ApiProperty({ example: "nguyenvana@gmail.com" })
  email: string;

  @ApiProperty({ example: "0905123456" })
  phone: string;

  @ApiProperty({
    example: { math_score: 8.5, ielts: 6.5 },
    description: "Dữ liệu JSON lưu điểm số",
    nullable: true,
  })
  rawdata: any;

  @ApiProperty({
    enum: ApplycationAdmissionStatus,
    example: ApplycationAdmissionStatus.PENDING,
  })
  status: ApplycationAdmissionStatus;

  @ApiProperty({ example: "2024-03-20T08:00:00.000Z" })
  createdAt: Date;

  @ApiProperty({ type: () => AdmissionItemResponseDto })
  admissionItem: AdmissionItemResponseDto;
}

// Dto dành cho thống kê
export class ApplicationStatsResponseDto {
  @ApiProperty({ enum: ApplycationAdmissionStatus, example: "PENDING" })
  status: ApplycationAdmissionStatus;

  @ApiProperty({ example: 15, description: "Số lượng đơn ở trạng thái này" })
  _count: {
    _all: number;
  };
}
