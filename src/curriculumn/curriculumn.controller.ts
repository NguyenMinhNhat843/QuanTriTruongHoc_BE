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
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiQuery,
} from "@nestjs/swagger";
import { CurriculumService } from "./service/curriculum.service";
import {
  CopyCurriculumDto,
  CreateCurriculumDto,
  CurriculumResponseDtoWithRelation,
  SearchCurriculumDto,
  UpdateCurriculumDto,
} from "./dto/curriculum.dto";

@ApiTags("Curriculums")
@Controller("curriculums")
export class CurriculumController {
  constructor(private readonly curriculumService: CurriculumService) {}

  @Post()
  @ApiOperation({ summary: "Tạo mới chương trình khung" })
  create(@Body() createCurriculumDto: CreateCurriculumDto) {
    return this.curriculumService.create(createCurriculumDto);
  }

  @Post("copy")
  @ApiOperation({ summary: "Sao chép chương trình khung" })
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async copyCurriculum(@Body() copyCurriculumDto: CopyCurriculumDto) {
    return this.curriculumService.copyCurriculum(copyCurriculumDto);
  }

  @Get()
  @ApiOperation({ summary: "Lấy danh sách tất cả chương trình khung" })
  @ApiOkResponse({ type: CurriculumResponseDtoWithRelation, isArray: true })
  @ApiQuery({ type: SearchCurriculumDto })
  findAll(
    @Query() query: SearchCurriculumDto,
  ): Promise<CurriculumResponseDtoWithRelation[]> {
    return this.curriculumService.findAll(query);
  }

  @Get("first")
  @ApiOperation({
    summary: "Lấy chương trình khung đầu tiên khớp với điều kiện",
  })
  @ApiOkResponse({ type: CurriculumResponseDtoWithRelation, nullable: true })
  findFirst(
    @Query() query: SearchCurriculumDto,
  ): Promise<CurriculumResponseDtoWithRelation | null> {
    return this.curriculumService.findFirst(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Lấy chi tiết chương trình khung theo ID" })
  @ApiOkResponse({ type: CurriculumResponseDtoWithRelation })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.curriculumService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Cập nhật chương trình khung" })
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
