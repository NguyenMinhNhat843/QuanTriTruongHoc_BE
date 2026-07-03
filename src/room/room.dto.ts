import { ApiProperty, OmitType } from "@nestjs/swagger";
import { PartialType } from "@nestjs/swagger";
import { Room } from "../../prisma/generated/prisma/client";
import { Type } from "class-transformer";
export class RoomDto implements Room {
  @ApiProperty()
  id: number;

  @ApiProperty()
  building: string | null;

  @ApiProperty({ type: Number, nullable: true })
  @Type(() => Number)
  capacity: number | null;

  @ApiProperty()
  roomCode: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  @Type(() => Date)
  createdAt: Date;
}

export class CreateRoomDto extends OmitType(RoomDto, ["id", "createdAt"]) {}
export class UpdateRoomDto extends PartialType(CreateRoomDto) {}
