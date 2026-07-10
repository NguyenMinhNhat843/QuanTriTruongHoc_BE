import { ApiProperty, OmitType, PartialType } from "@nestjs/swagger";
import { IsString } from "class-validator";
import { Ward } from "../../../prisma/generated/prisma/client";

export class WardDto implements Ward {
  @ApiProperty({ description: "Mã xã/phường/thị trấn" })
  @IsString()
  code: string;

  @ApiProperty({ description: "Tên xã/phường (Ví dụ: 'Phường Diên Khánh')" })
  @IsString()
  name: string;

  @ApiProperty({ description: "Tên đầy đủ của xã/phường" })
  @IsString()
  fullName: string;

  @ApiProperty({ description: "Mã định danh dạng chữ (Ví dụ: 'dien_khanh')" })
  @IsString()
  codeName: string;

  @ApiProperty({ description: "Khóa ngoại kết nối lên Tỉnh" })
  @IsString()
  provinceCode: string;
}

// Tạo Xã/Phường (gồm cả mã code tự định nghĩa)
export class CreateWardDto extends WardDto {}

export class UpdateWardDto extends PartialType(OmitType(WardDto, ["code"])) {}

// Tìm kiếm Xã/Phường (Thường dùng nhất là lọc danh sách Xã theo 'provinceCode')
export class SearchWardDto extends PartialType(WardDto) {}
