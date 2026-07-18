// dto/export-diem-ren-luyen.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsInt, IsNotEmpty } from "class-validator";

export class ExportDiemRenLuyenQueryDto {
  @ApiProperty({ example: 1, description: "ID của Lớp học cần xuất dữ liệu" })
  @IsNotEmpty()
  @IsInt()
  @Transform(({ value }) => parseInt(value))
  classId: number;

  @ApiProperty({ example: 2, description: "ID của Học kỳ cần xét" })
  @IsNotEmpty()
  @IsInt()
  @Transform(({ value }) => parseInt(value))
  semesterId: number;
}
