import { ApiProperty, OmitType, PartialType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, IsString } from "class-validator";
import { Village } from "../../../prisma/generated/prisma/client";

export class VillageDto implements Village {
  @ApiProperty({ description: "ID thôn/xóm tự tăng" })
  @IsNumber()
  @Type(() => Number)
  id: number;

  @ApiProperty({ description: "Tên thôn/xóm/ấp/bản/tổ dân phố" })
  @IsString()
  name: string;

  @ApiProperty({ description: "Khóa ngoại kết nối lên Xã" })
  @IsString()
  wardCode: string;
}

// Thôn sử dụng ID tự tăng (@default(autoincrement())), nên bắt buộc phải Omit trường 'id' khi tạo mới
export class CreateVillageDto extends OmitType(VillageDto, ["id"]) {}

export class UpdateVillageDto extends PartialType(CreateVillageDto) {}

// Lọc danh sách Thôn/Xóm theo 'wardCode' (Mã xã) hoặc tìm kiếm theo tên thôn
export class SearchVillageDto extends PartialType(
  OmitType(VillageDto, ["id"]),
) {}
