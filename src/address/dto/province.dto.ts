import { ApiProperty, OmitType, PartialType } from "@nestjs/swagger";
import { IsString } from "class-validator";
import { Province } from "../../../prisma/generated/prisma/client";

export class ProvinceDto implements Province {
  @ApiProperty({ description: "Mã tỉnh/thành phố (Ví dụ: '56')" })
  @IsString()
  code: string;

  @ApiProperty({ description: "Tên tỉnh (Ví dụ: 'Tỉnh Khánh Hòa')" })
  @IsString()
  name: string;

  @ApiProperty({ description: "Tên đầy đủ của tỉnh" })
  @IsString()
  fullName: string;

  @ApiProperty({ description: "Mã định danh dạng chữ (Ví dụ: 'khanh_hoa')" })
  @IsString()
  codeName: string;
}

// Khi tạo Tỉnh, cần truyền đầy đủ (bao gồm cả trường 'code' vì nó không tự tăng)
export class CreateProvinceDto extends ProvinceDto {}

// Cập nhật Tỉnh biến tất cả thành optional trừ 'code' (dùng làm identifier nếu cần, hoặc omit đi tùy logic route của bạn)
export class UpdateProvinceDto extends PartialType(
  OmitType(ProvinceDto, ["code"]),
) {}

// Tìm kiếm Tỉnh theo tên hoặc mã định danh
export class SearchProvinceDto extends PartialType(ProvinceDto) {}
