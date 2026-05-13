import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { MajorResponseDto } from "../major/major.response";
import { AdmissionStatus } from "../../prisma/generated/prisma/enums";

// tiêu chí tuyển sinh
export class CriterionResponseDto implements Readonly<CriterionResponseDto> {
  @ApiProperty({
    example: 1,
    description: "ID duy nhất của tiêu chí",
  })
  @Expose()
  id: number;

  @ApiProperty({
    example: "IELTS",
    description: "Tên của tiêu chí tuyển sinh",
  })
  @Expose()
  criterionName: string;

  @ApiProperty({
    example: "NUMBER",
    enum: ["NUMBER", "STRING", "BOOLEAN"],
    description: "Kiểu dữ liệu của tiêu chí",
  })
  @Expose()
  type: string;

  @ApiProperty({
    example: "Chứng chỉ tiếng Anh quốc tế",
    required: false,
    nullable: true,
  })
  @Expose()
  description: string | null;

  constructor(partial: Partial<CriterionResponseDto>) {
    Object.assign(this, partial);
  }
}

// Bảng trung gian giữa tiêu chí và chi tiết tuyển sinh
export class AdmissionItemCriterionResponseDto implements Readonly<AdmissionItemCriterionResponseDto> {
  @ApiProperty({ example: 10, description: "ID của mục tuyển sinh" })
  @Expose()
  admissionItemId: number;

  @ApiProperty({ example: 1, description: "ID của tiêu chí" })
  @Expose()
  criterionId: number;

  @ApiProperty({
    example: 8.0,
    required: false,
    nullable: true,
    description: "Giá trị tối thiểu yêu cầu (ví dụ: điểm sàn)",
  })
  @Expose()
  minValue: number | null;

  @ApiProperty({
    example: true,
    default: true,
    description: "Tiêu chí này có bắt buộc hay không",
  })
  @Expose()
  isRequired: boolean;

  @ApiProperty({
    example: 2.0,
    required: false,
    nullable: true,
    description: "Trọng số/Hệ số của tiêu chí (ví dụ: Toán hệ số 2)",
  })
  @Expose()
  weight: number | null;

  // Nhúng thông tin chi tiết của Criterion để UI hiển thị tên/loại tiêu chí
  @ApiProperty({ type: () => CriterionResponseDto })
  @Expose()
  @Type(() => CriterionResponseDto)
  criterion?: CriterionResponseDto;

  constructor(partial: Partial<AdmissionItemCriterionResponseDto>) {
    Object.assign(this, partial);
  }
}

// Chi tiết tuyển sinh theo ngành
export class AdmissionItemResponseDto implements Readonly<AdmissionItemResponseDto> {
  @ApiProperty({ example: 1, description: "ID chi tiết tuyển sinh" })
  @Expose()
  id: number;

  @ApiProperty({ example: 1, description: "ID đợt tuyển sinh tổng quát" })
  @Expose()
  admissionId: number;

  @ApiProperty({ example: 1, description: "ID ngành học" })
  @Expose()
  majorId: number;

  @ApiProperty({
    example: "K18",
    description: "Khóa tuyển sinh (Tự động tính từ Major)",
  })
  @Expose()
  batchName: string;

  @ApiProperty({
    example: 50,
    description: "Chỉ tiêu số lượng sinh viên cho ngành này",
  })
  @Expose()
  quota: number;

  // Nhúng thông tin ngành học
  @ApiProperty({ type: () => MajorResponseDto })
  @Expose()
  @Type(() => MajorResponseDto)
  major?: MajorResponseDto;

  // Quan hệ danh sách tiêu chí
  @ApiProperty({
    type: [AdmissionItemCriterionResponseDto],
    description: "Danh sách các điều kiện/tiêu chí để trúng tuyển ngành này",
  })
  @Expose()
  @Type(() => AdmissionItemCriterionResponseDto)
  criteria?: AdmissionItemCriterionResponseDto[];

  constructor(partial: Partial<AdmissionItemResponseDto>) {
    Object.assign(this, partial);
  }
}

// ============================== Đợt tuyển sinh tổng thể
export class AdmissionResponseDto implements Readonly<AdmissionResponseDto> {
  @ApiProperty({ example: 1, description: "ID đợt tuyển sinh" })
  @Expose()
  id: number;

  @ApiProperty({
    example: "Tuyển sinh Đợt 1 - 2026",
    description: "Tên hiển thị của đợt tuyển sinh",
  })
  @Expose()
  name: string;

  @ApiProperty({
    example: "2026-01-01T00:00:00Z",
    description: "Ngày bắt đầu nhận hồ sơ",
  })
  @Expose()
  startDate: Date;

  @ApiProperty({
    example: "2026-03-31T23:59:59Z",
    description: "Ngày kết thúc đợt tuyển sinh",
  })
  @Expose()
  endDate: Date;

  @ApiProperty({
    enum: AdmissionStatus,
    example: AdmissionStatus.OPEN,
    description: "Trạng thái hiện tại của đợt tuyển sinh",
  })
  @Expose()
  status: AdmissionStatus;

  // Danh sách các ngành thuộc đợt tuyển sinh này
  @ApiProperty({
    type: [AdmissionItemResponseDto],
    description: "Danh sách các ngành và chỉ tiêu tương ứng",
    required: false,
  })
  @Expose()
  @Type(() => AdmissionItemResponseDto)
  items?: AdmissionItemResponseDto[];

  constructor(partial: Partial<AdmissionResponseDto>) {
    Object.assign(this, partial);
  }
}
