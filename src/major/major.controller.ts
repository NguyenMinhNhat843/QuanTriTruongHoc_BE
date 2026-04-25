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
import { MajorService } from "./major.service";
import { MajorResponseDto } from "./major.response";
import { CreateMajorDto, UpdateMajorDto } from "./major.dto";

@ApiTags("Majors")
@Controller("majors")
export class MajorController {
  constructor(private readonly majorService: MajorService) {}

  @Post()
  @ApiOperation({ summary: "Tạo mới ngành đào tạo" })
  @ApiCreatedResponse({ type: MajorResponseDto })
  create(@Body() createMajorDto: CreateMajorDto) {
    return this.majorService.create(createMajorDto);
  }

  @Get()
  @ApiOperation({ summary: "Lấy danh sách tất cả ngành đào tạo" })
  @ApiOkResponse({ type: MajorResponseDto, isArray: true })
  findAll() {
    return this.majorService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Lấy chi tiết ngành đào tạo theo ID" })
  @ApiOkResponse({ type: MajorResponseDto })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.majorService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Cập nhật ngành đào tạo" })
  @ApiOkResponse({ type: MajorResponseDto })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateMajorDto: UpdateMajorDto,
  ) {
    return this.majorService.update(id, updateMajorDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Xóa ngành đào tạo" })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.majorService.remove(id);
  }
}
