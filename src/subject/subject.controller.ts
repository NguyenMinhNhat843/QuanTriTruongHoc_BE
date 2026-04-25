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
import { SubjectService } from "./subject.service";
import { CreateSubjectDto, UpdateSubjectDto } from "./subject.dto";
import { SubjectResponseDto } from "./subject.response";

@ApiTags("Subjects")
@Controller("subjects")
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Post()
  @ApiOperation({ summary: "Tạo mới môn học" })
  @ApiCreatedResponse({ type: SubjectResponseDto })
  create(@Body() createSubjectDto: CreateSubjectDto) {
    return this.subjectService.create(createSubjectDto);
  }

  @Get()
  @ApiOperation({ summary: "Lấy danh sách tất cả môn học" })
  @ApiOkResponse({ type: SubjectResponseDto, isArray: true })
  findAll() {
    return this.subjectService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Lấy chi tiết môn học theo ID" })
  @ApiOkResponse({ type: SubjectResponseDto })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.subjectService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Cập nhật thông tin môn học" })
  @ApiOkResponse({ type: SubjectResponseDto })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateSubjectDto: UpdateSubjectDto,
  ) {
    return this.subjectService.update(id, updateSubjectDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Xóa môn học" })
  @ApiOkResponse({ description: "Xóa thành công" })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.subjectService.remove(id);
  }
}
