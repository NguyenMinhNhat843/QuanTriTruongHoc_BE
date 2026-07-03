import { OmitType } from "@nestjs/swagger";
import { PartialType } from "@nestjs/swagger";
import { Room } from "../../prisma/generated/prisma/client";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

// 1. Định nghĩa Enum cho các loại phòng trường nghề
export enum RoomType {
  THEORY = "Lý thuyết",
  PRACTICE = "Thực hành",
  LAB = "Phòng Lab/Máy tính",
  WORKSHOP = "Xưởng thực tập",
  FUNCTIONAL = "Phòng chức năng", // Hội trường, thư viện, phòng họp...
}

export class RoomDto implements Room {
  @ApiProperty()
  id: number;

  @ApiProperty({ type: String, nullable: true })
  building: string | null;

  @ApiProperty({ type: Number, nullable: true })
  @Type(() => Number)
  capacity: number | null;

  @ApiProperty()
  roomCode: string;

  // 2. Cập nhật trường type sử dụng Enum và khai báo rõ cho Swagger biết
  @ApiProperty({
    enum: RoomType,
    example: RoomType.PRACTICE,
  })
  type: RoomType;

  @ApiProperty()
  @Type(() => Date)
  createdAt: Date;
}

export class CreateRoomDto extends OmitType(RoomDto, ["id", "createdAt"]) {}
export class UpdateRoomDto extends PartialType(CreateRoomDto) {}
export class SearchRoomDto extends PartialType(RoomDto) {}
