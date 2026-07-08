import { ApiProperty, OmitType, PartialType, PickType } from "@nestjs/swagger";
import { IsInt, IsNumber, Min } from "class-validator";
import { TuitionConfigItem } from "../../../prisma/generated/prisma/client";

// 1. Base DTO chứa đầy đủ các thuộc tính phẳng từ Model (Lược bỏ quan hệ config và feeCategory)
export class TuitionConfigItemDto implements TuitionConfigItem {
  @ApiProperty()
  @IsInt()
  id: number;

  @ApiProperty()
  @IsInt()
  configId: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount: number;
}

// 2. Create DTO: Loại bỏ trường tự động sinh (id)
export class CreateTuitionConfigItemDto extends OmitType(TuitionConfigItemDto, [
  "id",
  "configId",
] as const) {}

// 3. Update DTO: Kế thừa từ Create DTO nhưng tất cả các trường đều là optional
export class UpdateTuitionConfigItemDto extends PartialType(
  CreateTuitionConfigItemDto,
) {}

// 4. Search DTO: Tìm kiếm theo configId hoặc feeCategoryId
export class SearchTuitionConfigItemDto extends PickType(TuitionConfigItemDto, [
  "configId",
  "name",
] as const) {}
