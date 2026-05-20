import { Controller, Post, Body } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { GradeEntryService } from "./gradeEntry.service";
import { SaveGradeEntries, CreateManyGradeEntriesDto } from "./gradEntry.dto";

@ApiTags("Grade Entries - Nhập điểm")
@Controller("grade-entries")
export class GradeEntryController {
  constructor(private readonly gradeEntryService: GradeEntryService) {}

  @Post("submit-grade")
  @ApiOperation({
    summary: "Lưu nháp điểm",
  })
  @ApiResponse({
    status: 201,
  })
  async submitGrade(@Body() dto: CreateManyGradeEntriesDto) {
    return this.gradeEntryService.saveDraftGrade(dto);
  }

  @Post("save-grade")
  @ApiOperation({
    summary: "Chốt bảng điểm",
  })
  @ApiResponse({ status: 200, description: "Chốt bảng điểm thành công" })
  async approveGrade(@Body() body: SaveGradeEntries) {
    return this.gradeEntryService.saveGradeEntries(body);
  }
}
