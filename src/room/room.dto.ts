import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsOptional,
  Min,
  MaxLength,
} from "class-validator";
import { PartialType } from "@nestjs/swagger";

export class CreateRoomDto {
  @ApiProperty({ example: "A1.102", description: "Mã phòng học duy nhất" })
  @IsString()
  @IsNotEmpty({ message: "Mã phòng học không được để trống" })
  @MaxLength(20)
  roomCode: string;

  @ApiProperty({
    example: "theory",
    description:
      "Loại phòng: theory (lý thuyết), practice (thực hành), hall (hội trường)",
  })
  @IsString()
  @IsNotEmpty({ message: "Loại phòng không được để trống" })
  type: string;

  @ApiPropertyOptional({ example: 45, description: "Sức chứa của phòng" })
  @IsInt()
  @Min(1)
  @IsOptional()
  capacity?: number;

  @ApiPropertyOptional({ example: "Tòa A", description: "Tòa nhà" })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  building?: string;
}

export class UpdateRoomDto extends PartialType(CreateRoomDto) {}
