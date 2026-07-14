import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateRoomDto,
  RoomDto,
  SearchRoomDto,
  UpdateRoomDto,
} from "./room.dto";
import { plainToInstance } from "class-transformer";

@Injectable()
export class RoomService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateRoomDto): Promise<RoomDto> {
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
      return plainToInstance(RoomDto, room);
    } catch (error) {
      Logger.error("Lỗi khi tạo phòng học:", error);
      throw new InternalServerErrorException("Lỗi hệ thống khi tạo phòng học");
    }
  }

  async findOne(id: number): Promise<RoomDto> {
    const room = await this.prisma.room.findUnique({
      where: { id },
    });

    if (!room) {
      throw new NotFoundException(`Không tìm thấy phòng học với ID ${id}`);
    }
    return plainToInstance(RoomDto, room);
  }

  async update(id: number, data: UpdateRoomDto): Promise<RoomDto> {
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
      return plainToInstance(RoomDto, updated);
    } catch (error) {
      Logger.error("Lỗi khi cập nhật phòng học:", error);
      throw new InternalServerErrorException("Lỗi khi cập nhật phòng học");
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.room.delete({ where: { id } });
  }

  async search(query: SearchRoomDto): Promise<RoomDto[]> {
    const { roomCode, type } = query;
    const whereClause: any = {};

    if (roomCode) {
      whereClause.roomCode = {
        contains: roomCode,
        mode: "insensitive", // Tìm kiếm không phân biệt chữ hoa / chữ thường
      };
    }

    if (type) {
      whereClause.type = type;
    }

    try {
      const rooms = await this.prisma.room.findMany({
        where: whereClause,
      });
      return plainToInstance(RoomDto, rooms);
    } catch (error) {
      Logger.error("Lỗi khi lấy danh sách/tìm kiếm phòng học:", error);
      throw new InternalServerErrorException(
        "Lỗi hệ thống khi tìm kiếm phòng học",
      );
    }
  }
}
