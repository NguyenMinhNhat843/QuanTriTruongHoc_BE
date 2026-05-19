import { Controller, Post, Body, Get, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { GradeEntryService } from "./gradeEntry.service";
import {
  ApproveGradeEntryDto,
  CreateManyGradeEntriesDto,
} from "./gradEntry.dto";
import {
  SubmissionHistoryResponse,
  SubmitGradeResponse,
} from "./gradeSubmis.response";

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

  /**
   * Lấy danh sách submit điểm theo lớp
   */
  @Get("submission-history")
  @ApiOperation({
    summary: "Lấy lịch sử submit điểm của 1 lớp học phần",
  })
  @ApiResponse({
    status: 200,
    type: [SubmissionHistoryResponse],
  })
  async getSubmissionHistory(@Query("courseOfferId") courseOfferId: number) {
    return this.gradeEntryService.getSubmissionHistory(courseOfferId);
  }

  /**
   * Lấy danh sách điểm hiện tại
   */
}
