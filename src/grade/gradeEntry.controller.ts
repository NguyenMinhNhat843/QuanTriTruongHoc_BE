import { Controller, Post, Body } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { GradeEntryService } from "./gradeEntry.service";
import { CreateManyGradeEntriesDto } from "./gradEntry.dto";

@ApiTags("Grade Entries")
@Controller("grade-entries")
export class GradeEntryController {
  constructor(private readonly gradeEntryService: GradeEntryService) {}

  @Post("submit-grade")
  @ApiOperation({
    summary: "Nộp duyệt nhập điểm cho 1 lớp học",
  })
  @ApiResponse({ status: 201, description: "Nhập điểm thành công" })
  async submitGrade(@Body() dto: CreateManyGradeEntriesDto) {
    return this.gradeEntryService.submitGrade(dto);
  }
}
