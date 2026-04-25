import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
} from "@nestjs/swagger";
import { RoomService } from "./room.service";
import { RoomResponseDto } from "./room.response";
import { CreateRoomDto, UpdateRoomDto } from "./room.dto";

@ApiTags("Rooms")
@Controller("rooms")
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  @ApiOperation({ summary: "Tạo mới phòng học" })
  @ApiCreatedResponse({ type: RoomResponseDto })
  create(@Body() createRoomDto: CreateRoomDto) {
    return this.roomService.create(createRoomDto);
  }

  @Get()
  @ApiOperation({ summary: "Lấy danh sách tất cả phòng học" })
  @ApiOkResponse({ type: RoomResponseDto, isArray: true })
  findAll() {
    return this.roomService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Lấy chi tiết phòng học theo ID" })
  @ApiOkResponse({ type: RoomResponseDto })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.roomService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Cập nhật thông tin phòng học" })
  @ApiOkResponse({ type: RoomResponseDto })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateRoomDto: UpdateRoomDto,
  ) {
    return this.roomService.update(id, updateRoomDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Xóa phòng học" })
  @ApiOkResponse({ description: "Xóa thành công" })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.roomService.remove(id);
  }
}
