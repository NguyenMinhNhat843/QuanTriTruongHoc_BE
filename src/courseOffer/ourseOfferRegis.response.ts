import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { CourseRegistration } from "../../prisma/generated/prisma/client";
import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDate,
  IsEnum,
  ValidateNested,
  IsNumber,
  Min,
  Max,
} from "class-validator";
import { Type } from "class-transformer";
import { StudentResponseDto } from "../student/student.response";
import { GradeEntryResponseDto } from "../grade/gradeEntry.response";

// Giả sử bạn có Enum cho trạng thái đăng ký, nếu không có bạn có thể bỏ IsEnum và dùng IsString
export enum RegistrationStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export class CourseOfferRegisResponseDto implements CourseRegistration {
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  id: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  kttx1!: number | null;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  kttx2!: number | null;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  kttx3!: number | null;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  ktdk1!: number | null;

  @ApiPropertyOptional({
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  ktdk2!: number | null;

  @ApiPropertyOptional({
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  ktdk3!: number | null;

  @ApiPropertyOptional({
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  ktdk4!: number | null;

  @ApiPropertyOptional({
    type: Number,
  })
  @IsOptional()
  @IsNumber({})
  @Min(0)
  @Max(10)
  diemKiemTra1!: number | null;

  @ApiPropertyOptional({
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  diemKiemTra2!: number | null;

  @ApiPropertyOptional({
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  diemTB!: number | null;

  @ApiPropertyOptional({
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  diemTongKet1!: number | null;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  diemTongKet2!: number | null;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  courseOfferId: number;

  @ApiProperty({ example: 20260001, description: "ID của sinh viên đăng ký" })
  @IsInt()
  @IsNotEmpty()
  studentId: number;

  @ApiProperty({
    example: RegistrationStatus.PENDING,
    enum: RegistrationStatus,
    description: "Trạng thái của đơn đăng ký học phần",
  })
  @IsEnum(RegistrationStatus)
  @IsNotEmpty()
  status: string;

  @ApiPropertyOptional({
    example: "Đăng ký học cải thiện điểm",
    nullable: true,
    description: "Ghi chú của sinh viên khi đăng ký",
    type: String,
  })
  @IsString()
  @IsOptional()
  note: string | null;

  @ApiProperty({
    example: "2026-05-16T02:15:00.000Z",
    description: "Thời điểm hệ thống ghi nhận đăng ký",
  })
  @IsDate()
  @Type(() => Date)
  registeredAt: Date;

  @ApiPropertyOptional({ type: Number })
  finalGrade: number | null;

  @ApiPropertyOptional({
    example: "2026-05-16T03:00:00.000Z",
    nullable: true,
    description: "Thời điểm đơn đăng ký được phê duyệt",
    type: Date,
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  approvedAt: Date | null;

  @ApiProperty({
    example: "2026-05-16T02:15:00.000Z",
    description: "Thời điểm tạo bản ghi",
  })
  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty({
    example: "2026-05-16T03:00:00.000Z",
    description: "Thời điểm cập nhật bản ghi gần nhất",
  })
  @IsDate()
  @Type(() => Date)
  updatedAt: Date;

  @ApiProperty({
    type: () => StudentResponseDto,
    description: "Thông tin chi tiết của sinh viên đăng ký",
  })
  @ValidateNested() // Đảm bảo class-validator sẽ chạy vào validate sâu bên trong StudentResponseDto nếu cần
  @Type(() => StudentResponseDto) // Ép kiểu object thô sang Instance của StudentResponseDto
  student: StudentResponseDto;

  @ApiProperty({ type: GradeEntryResponseDto, isArray: true, nullable: true })
  gradeEntries: GradeEntryResponseDto[] | null; // Thêm trường này để chứa grade entries khi cần thiết
}
