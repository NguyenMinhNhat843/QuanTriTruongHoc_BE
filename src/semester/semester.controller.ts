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
import { SemesterService } from "./semester.service";
import { SemesterResponseDto } from "./semester.response";
import { CreateSemesterDto, UpdateSemesterDto } from "./semester.dto";

@ApiTags("Semesters")
@Controller("semesters")
export class SemesterController {
  constructor(private readonly semesterService: SemesterService) {}

  @Post()
  @ApiOperation({ summary: "Tạo mới học kỳ" })
  @ApiCreatedResponse({ type: SemesterResponseDto })
  create(@Body() createSemesterDto: CreateSemesterDto) {
    return this.semesterService.create(createSemesterDto);
  }

  @Get("current")
  @ApiOperation({ summary: "Lấy học kỳ hiện tại đang hoạt động" })
  @ApiOkResponse({ type: SemesterResponseDto })
  getCurrent() {
    return this.semesterService.getCurrentSemester();
  }

  @Get()
  @ApiOperation({ summary: "Lấy danh sách tất cả học kỳ" })
  @ApiOkResponse({ type: SemesterResponseDto, isArray: true })
  findAll() {
    return this.semesterService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Lấy chi tiết học kỳ theo ID" })
  @ApiOkResponse({ type: SemesterResponseDto })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.semesterService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Cập nhật thông tin học kỳ" })
  @ApiOkResponse({ type: SemesterResponseDto })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateSemesterDto: UpdateSemesterDto,
  ) {
    return this.semesterService.update(id, updateSemesterDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Xóa học kỳ" })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.semesterService.remove(id);
  }
}
