import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class RoomResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "A1.102" })
  roomCode: string;

  @ApiProperty({ example: "theory" })
  type: string;

  @ApiPropertyOptional({ example: 45, nullable: true })
  capacity?: number;

  @ApiPropertyOptional({ example: "Tòa A", nullable: true })
  building?: string;

  @ApiProperty({ example: "2024-04-25T10:00:00Z" })
  createdAt: Date;

  // --- Dữ liệu thống kê quan hệ ---
  @ApiPropertyOptional({
    example: 10,
    description: "Số lượng lịch học tại phòng này",
  })
  scheduleCount?: number;

  constructor(partial: any) {
    this.id = partial.id;
    this.roomCode = partial.roomCode;
    this.type = partial.type;
    this.capacity = partial.capacity;
    this.building = partial.building;
    this.createdAt = partial.createdAt;

    // Map số lượng quan hệ từ Prisma _count (nếu có dùng include trong service)
    if (partial._count) {
      this.scheduleCount = partial._count.courseSchedules;
    }
  }
}
