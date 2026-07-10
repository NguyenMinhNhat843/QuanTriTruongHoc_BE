import { ApiProperty, OmitType, PartialType, PickType } from "@nestjs/swagger";
import { IsDate, IsInt, IsNumber, IsOptional, Min } from "class-validator";
import { TuitionConfig } from "../../../prisma/generated/prisma/client";
import {
  CreateTuitionConfigItemDto,
  TuitionConfigItemDto,
} from "./tuition-config-item.dto"; // Import DTO items đã tạo ở bước trước
import { MajorDto } from "../../major/major.dto";
import { Type } from "class-transformer";

// 1. Base DTO chứa đầy đủ các thuộc tính phẳng từ Model (Lược bỏ các quan hệ đối tượng)
export class TuitionConfigDto implements TuitionConfig {
  @ApiProperty()
  @IsInt()
  id: number;

  @ApiProperty()
  @IsInt()
  @Type(() => Number)
  periodId: number;

  @ApiProperty({ type: Number, required: false, nullable: true })
  @IsOptional()
  @IsInt()
  majorId: number | null;

  @ApiProperty({ type: Number, required: false, nullable: true })
  @IsOptional()
  @IsInt()
  batchId: number | null;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  minRequiredAmount: number;

  @ApiProperty()
  @IsDate()
  createdAt: Date;

  @ApiProperty()
  @IsDate()
  updatedAt: Date;
}

// 2. Create DTO: Loại bỏ các trường tự động sinh (id, createdAt, updatedAt)
export class CreateTuitionConfigDto extends OmitType(TuitionConfigDto, [
  "id",
  "createdAt",
  "updatedAt",
] as const) {
  @ApiProperty({ type: () => [CreateTuitionConfigItemDto] })
  items: CreateTuitionConfigItemDto[];
}

// 3. Update DTO: Kế thừa từ Create DTO nhưng tất cả các trường đều là optional
export class UpdateTuitionConfigDto extends PartialType(
  CreateTuitionConfigDto,
) {}

// 4. Search DTO: Tìm kiếm theo kì (periodId), ngành (majorId) hoặc khóa (batchId)
export class SearchTuitionConfigDto extends PartialType(
  PickType(TuitionConfigDto, ["periodId", "majorId", "batchId"] as const),
) {}

// 5. Response DTO kèm theo mối quan hệ (Relation)
export class TuitionConfigWithItemsDto extends TuitionConfigDto {
  @ApiProperty({ type: () => [TuitionConfigItemDto] }) // Khai báo kiểu mảng cho Swagger UI nhận diện
  items: TuitionConfigItemDto[];

  @ApiProperty({ type: () => MajorDto, required: false, nullable: true })
  major: MajorDto;
}
