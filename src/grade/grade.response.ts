import { ApiProperty } from "@nestjs/swagger";
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsPositive,
  ValidateNested,
} from "class-validator";
import { SubjectResponseDto } from "../subject/subject.response";
import { Type } from "class-transformer";

export class GradeComponentDto {
  @ApiProperty({
    example: 1,
    description: "ID định danh cấu hình thành phần điểm",
  })
  id: number;

  @ApiProperty({
    example: "midterm",
    description: "Tên thành phần điểm (Ví dụ: attendance, midterm, final)",
  })
  name: string;
}

export class SubjetGradeWeightResponseDtoSimple {
  @ApiProperty({
    example: 1,
    description: "ID cấu hình trọng số",
  })
  @IsInt()
  id: number;

  @ApiProperty({
    example: 10,
    description: "ID môn học",
  })
  @IsInt()
  subjectId: number;

  @ApiProperty({
    example: 2,
    description: "ID loại điểm",
  })
  @IsInt()
  gradeComponentId: number;

  @ApiProperty({
    example: 0.3,
    description: "Trọng số điểm của môn học",
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message: "weight phải là số hợp lệ",
    },
  )
  @IsPositive()
  weight: number;

  @ApiProperty({
    example: "2026-05-16T07:30:00.000Z",
    description: "Ngày tạo",
  })
  @IsDateString()
  createdAt: Date;

  @ApiProperty({
    example: "2026-05-16T07:30:00.000Z",
    description: "Ngày cập nhật",
  })
  @IsDateString()
  updatedAt: Date;

  @ApiProperty({
    type: GradeComponentDto,
    description: "Thông tin thành phần điểm",
  })
  @ValidateNested()
  @Type(() => GradeComponentDto)
  gradeComponent: GradeComponentDto;
}

export class SubjectGradeWeightResponseDto {
  @ApiProperty({
    example: 1,
    description: "ID cấu hình trọng số",
  })
  @IsInt()
  id: number;

  @ApiProperty({
    example: 10,
    description: "ID môn học",
  })
  @IsInt()
  subjectId: number;

  @ApiProperty({
    type: SubjectResponseDto,
    description: "Thông tin môn học",
  })
  @ValidateNested()
  @Type(() => SubjectResponseDto)
  subject: SubjectResponseDto;

  @ApiProperty({
    example: 2,
    description: "ID loại điểm",
  })
  @IsInt()
  gradeComponentId: number;

  @ApiProperty({
    type: GradeComponentDto,
    description: "Thông tin thành phần điểm",
  })
  @ValidateNested()
  @Type(() => GradeComponentDto)
  gradeComponent: GradeComponentDto;

  @ApiProperty({
    example: 0.3,
    description: "Trọng số điểm của môn học",
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message: "weight phải là số hợp lệ",
    },
  )
  @IsPositive()
  weight: number;

  @ApiProperty({
    example: "2026-05-16T07:30:00.000Z",
    description: "Ngày tạo",
  })
  @IsDateString()
  createdAt: Date;

  @ApiProperty({
    example: "2026-05-16T07:30:00.000Z",
    description: "Ngày cập nhật",
  })
  @IsDateString()
  updatedAt: Date;
}
