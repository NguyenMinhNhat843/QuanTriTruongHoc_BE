import { ApiProperty, OmitType, PartialType, PickType } from "@nestjs/swagger";
import {
  IsBoolean,
  IsDate,
  IsInt,
  IsNotEmpty,
  IsString,
} from "class-validator";
import { TuitionPeriod } from "../../../prisma/generated/prisma/client";
import { Type } from "class-transformer";

// 1. Base DTO chứa đầy đủ các thuộc tính phẳng từ Model
export class TuitionPeriodDto implements Omit<
  TuitionPeriod,
  "semester" | "configs" | "invoices"
> {
  @ApiProperty()
  @IsInt()
  id: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsInt()
  semesterId: number;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @ApiProperty()
  @IsBoolean()
  isActive: boolean;

  @ApiProperty()
  @IsDate()
  createdAt: Date;
}

// 2. Create DTO: Loại bỏ các trường tự động sinh (id, createdAt) và default hệ thống (isActive nếu muốn tự gán true)
export class CreateTuitionPeriodDto extends OmitType(TuitionPeriodDto, [
  "id",
  "isActive",
  "createdAt",
] as const) {}

// 3. Update DTO: Kế thừa từ Create DTO nhưng tất cả các trường đều optional
export class UpdateTuitionPeriodDto extends PartialType(
  CreateTuitionPeriodDto,
) {}

// 4. Search DTO: Chỉ tìm kiếm dựa trên tên
export class SearchTuitionPeriodDto extends PartialType(
  PickType(TuitionPeriodDto, ["name", "semesterId"] as const),
) {}
