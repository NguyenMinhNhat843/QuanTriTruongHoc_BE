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
import { CurriculumService } from "./curriculum.service";
import { CreateCurriculumDto, UpdateCurriculumDto } from "./curriculum.dto";
import { CurriculumResponseDto } from "./curriculum.response";

@ApiTags("Curriculums")
@Controller("curriculums")
export class CurriculumController {
  constructor(private readonly curriculumService: CurriculumService) {}

  @Post()
  @ApiOperation({ summary: "Tạo mới chương trình khung" })
  @ApiCreatedResponse({ type: CurriculumResponseDto })
  create(
    @Body() createCurriculumDto: CreateCurriculumDto,
  ): Promise<CurriculumResponseDto> {
    return this.curriculumService.create(createCurriculumDto);
  }

  @Get()
  @ApiOperation({ summary: "Lấy danh sách tất cả chương trình khung" })
  @ApiOkResponse({ type: CurriculumResponseDto, isArray: true })
  findAll() {
    return this.curriculumService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Lấy chi tiết chương trình khung theo ID" })
  @ApiOkResponse({ type: CurriculumResponseDto })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.curriculumService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Cập nhật chương trình khung" })
  @ApiOkResponse({ type: CurriculumResponseDto })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateCurriculumDto: UpdateCurriculumDto,
  ) {
    return this.curriculumService.update(id, updateCurriculumDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Xóa chương trình khung" })
  @ApiOkResponse({ description: "Xóa thành công" })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.curriculumService.remove(id);
  }
}
