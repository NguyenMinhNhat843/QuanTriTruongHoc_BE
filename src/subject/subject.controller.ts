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
} from "@nestjs/swagger";
import { SubjectService } from "./subject.service";
import {
  CreateSubjectDto,
  ResponseSubjectDto,
  SearchSubjectDto,
  UpdateSubjectDto,
} from "./dto/subject.dto";

@ApiTags("Subjects")
@Controller("subjects")
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Post()
  @ApiOperation({ summary: "Tạo mới môn học" })
  @ApiCreatedResponse({ type: ResponseSubjectDto })
  create(@Body() createSubjectDto: CreateSubjectDto) {
    return this.subjectService.create(createSubjectDto);
  }

  @Get()
  @ApiOperation({ summary: "Lấy danh sách tất cả môn học" })
  @ApiOkResponse({ type: ResponseSubjectDto, isArray: true })
  findAll(@Query() query: SearchSubjectDto) {
    return this.subjectService.findAll(query);
  }

  @Get("subjects-by-class-and-semester")
  @ApiOperation({ summary: "Lấy danh sách môn học theo lớp và học kỳ" })
  @ApiOkResponse({ type: ResponseSubjectDto, isArray: true })
  getSubjectsByClassAndSemester(
    @Query("classId", ParseIntPipe) classId: number,
    @Query("semesterId", ParseIntPipe) semesterId: number,
  ) {
    return this.subjectService.getSubjectsByClassAndSemester(
      classId,
      semesterId,
    );
  }

  @Get(":id")
  @ApiOperation({ summary: "Lấy chi tiết môn học theo ID" })
  @ApiOkResponse({ type: ResponseSubjectDto })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.subjectService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Cập nhật thông tin môn học" })
  @ApiOkResponse({ type: ResponseSubjectDto })
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
