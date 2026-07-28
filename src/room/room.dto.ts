import { OmitType } from "@nestjs/swagger";
import { PartialType } from "@nestjs/swagger";
import { Room, RoomType } from "../../prisma/generated/prisma/client";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

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

  @ApiProperty({ type: String, nullable: true })
  roomName: string | null;

  @ApiProperty({
    enum: RoomType,
  })
  type: RoomType;

  @ApiProperty()
  @Type(() => Date)
  createdAt: Date;
}

export class CreateRoomDto extends OmitType(RoomDto, ["id", "createdAt"]) {}
export class UpdateRoomDto extends PartialType(CreateRoomDto) {}
export class SearchRoomDto extends PartialType(RoomDto) {}
