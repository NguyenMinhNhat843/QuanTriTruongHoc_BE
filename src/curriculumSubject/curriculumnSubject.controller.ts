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
import { CurriculumSubjectService } from "./curriculumnSubject.service";
import { CurriculumSubjectResponseDto } from "./curriculumnSubject.response";
import {
  CreateCurriculumSubjectDto,
  UpdateCurriculumSubjectDto,
} from "./curriculumnSubject.dto";

@ApiTags("Curriculum Subjects")
@Controller("curriculum-subjects")
export class CurriculumSubjectController {
  constructor(private readonly csService: CurriculumSubjectService) {}

  @Post()
  @ApiOperation({ summary: "Thêm môn học vào chương trình khung" })
  @ApiCreatedResponse({ type: CurriculumSubjectResponseDto })
  create(@Body() createDto: CreateCurriculumSubjectDto) {
    return this.csService.create(createDto);
  }

  @Get("curriculum/:id")
  @ApiOperation({ summary: "Lấy danh sách môn học của một chương trình khung" })
  @ApiOkResponse({ type: CurriculumSubjectResponseDto, isArray: true })
  findByCurriculum(@Param("id", ParseIntPipe) id: number) {
    return this.csService.findByCurriculum(id);
  }

  @Patch(":id")
  @ApiOperation({
    summary:
      "Cập nhật thông tin môn trong chương trình (kỳ học, điểm tối thiểu...)",
  })
  @ApiOkResponse({ type: CurriculumSubjectResponseDto })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateCurriculumSubjectDto,
  ) {
    return this.csService.update(id, updateDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Xóa môn học khỏi chương trình khung" })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.csService.remove(id);
  }
}
