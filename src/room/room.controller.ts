import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiResponse,
} from "@nestjs/swagger";
import { RoomService } from "./room.service";
import {
  CreateRoomDto,
  RoomDto,
  SearchRoomDto,
  UpdateRoomDto,
} from "./room.dto";

@ApiTags("Rooms")
@Controller("rooms")
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  @ApiOperation({ summary: "Tạo mới phòng học" })
  @ApiCreatedResponse({ type: RoomDto })
  create(@Body() createRoomDto: CreateRoomDto) {
    return this.roomService.create(createRoomDto);
  }

  @Get()
  @ApiOperation({ summary: "Tìm kiếm phòng học" })
  @ApiResponse({ status: 200, type: [RoomDto] })
  async getRooms(@Query() query: SearchRoomDto) {
    return this.roomService.search(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Lấy chi tiết phòng học theo ID" })
  @ApiOkResponse({ type: RoomDto })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.roomService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Cập nhật thông tin phòng học" })
  @ApiOkResponse({ type: RoomDto })
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
