import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RoomResponseDto } from "./room.response";
import { CreateRoomDto, UpdateRoomDto } from "./room.dto";

@Injectable()
export class RoomService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateRoomDto): Promise<RoomResponseDto> {
    // 1. Kiểm tra mã phòng đã tồn tại chưa
    const existingRoom = await this.prisma.room.findUnique({
      where: { roomCode: data.roomCode },
    });

    if (existingRoom) {
      throw new ConflictException(`Mã phòng học ${data.roomCode} đã tồn tại`);
    }

    try {
      const room = await this.prisma.room.create({
        data,
      });
      return new RoomResponseDto(room);
    } catch (error) {
      console.log("Lỗi khi tạo phòng học:", error);
      throw new InternalServerErrorException("Lỗi hệ thống khi tạo phòng học");
    }
  }

  async findAll(): Promise<RoomResponseDto[]> {
    const rooms = await this.prisma.room.findMany({
      include: {
        _count: { select: { courseSchedules: true } },
      },
    });
    return rooms.map((room) => new RoomResponseDto(room));
  }

  async findOne(id: number): Promise<RoomResponseDto> {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: {
        _count: { select: { courseSchedules: true } },
      },
    });

    if (!room) {
      throw new NotFoundException(`Không tìm thấy phòng học với ID ${id}`);
    }
    return new RoomResponseDto(room);
  }

  async update(id: number, data: UpdateRoomDto): Promise<RoomResponseDto> {
    // Kiểm tra phòng học có tồn tại không
    await this.findOne(id);

    // Nếu cập nhật mã phòng, kiểm tra xem mã mới có trùng với phòng khác không
    if (data.roomCode) {
      const existing = await this.prisma.room.findUnique({
        where: { roomCode: data.roomCode, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException(
          `Mã phòng học ${data.roomCode} đã bị sử dụng`,
        );
      }
    }

    try {
      const updated = await this.prisma.room.update({
        where: { id },
        data,
      });
      return new RoomResponseDto(updated);
    } catch (error) {
      console.log("Lỗi khi cập nhật phòng học:", error);
      throw new InternalServerErrorException("Lỗi khi cập nhật phòng học");
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.room.delete({ where: { id } });
  }
}
