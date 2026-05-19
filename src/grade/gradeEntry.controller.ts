import { Controller, Post, Body } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { GradeEntryService } from "./gradeEntry.service";
import {
  ApproveGradeEntryDto,
  CreateManyGradeEntriesDto,
} from "./gradEntry.dto";
import { SubmitGradeResponse } from "./gradeSubmis.response";

@ApiTags("Grade Entries - Nhập điểm")
@Controller("grade-entries")
export class GradeEntryController {
  constructor(private readonly gradeEntryService: GradeEntryService) {}

  @Post("submit-grade")
  @ApiOperation({
    summary: "Nộp duyệt nhập điểm cho 1 lớp học",
  })
  @ApiResponse({
    status: 201,
    type: SubmitGradeResponse,
  })
  async submitGrade(@Body() dto: CreateManyGradeEntriesDto) {
    return this.gradeEntryService.submitGrade(dto);
  }

  @Post("approve-grade")
  @ApiOperation({
    summary: "Phê duyệt điểm cho 1 lớp học",
  })
  @ApiResponse({ status: 200, description: "Phê duyệt điểm thành công" })
  async approveGrade(@Body() body: ApproveGradeEntryDto) {
    return this.gradeEntryService.approveGradeEntry(body);
  }
}
