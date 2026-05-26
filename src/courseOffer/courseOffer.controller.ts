import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { CourseOfferService } from "./courseOffer.service";

import { CourseOfferDetailResponseDto } from "./courseOfferDetail.response";
import { Response } from "express";
import {
  CourseOfferDto,
  // CourseOfferDto,
  ResponsePreviewGenerateSectionForClass,
} from "./courseOffer.response";
import { SearchCourseOfferDto } from "./courseOffer.dto";

@ApiTags("CourseOffer - Lớp học phần")
@Controller("course-offers")
export class CourseOfferController {
  constructor(private readonly courseOfferService: CourseOfferService) {}

  @Get()
  @ApiOperation({ summary: "Lấy danh sách lớp học phần" })
  @ApiResponse({
    status: 200,
    type: [CourseOfferDto],
  })
  async getAll(@Query() query: SearchCourseOfferDto) {
    return this.courseOfferService.findAll(query);
  }

  /**
   * API Xem trước danh sách lớp học phần sẽ sinh tự động
   */
  @Get("previewpreviewGenerateSectionForClass")
  @ApiOperation({
    summary: "Xem trước danh sách lớp học phần tự động",
  })
  @ApiResponse({
    status: 200,
    description: "Lấy dữ liệu cấu trúc xem trước thành công.",
    type: [ResponsePreviewGenerateSectionForClass], // Swagger sẽ lấy schema từ DTO này để hiển thị mẫu dữ liệu trả về
  })
  async previewGenerateSectionForClass(
    @Query("classId", ParseIntPipe) classId: number,
    @Query("semesterId", ParseIntPipe) semesterId: number,
  ) {
    return this.courseOfferService.previewGenerateSectionForClass(
      classId,
      semesterId,
    );
  }

  @Post("gen-classSubject-grades")
  @ApiOperation({
    summary: "Tự động tạo lớp học phần cho một lớp hành chính",
    description:
      "Dựa trên danh sách môn học của lớp hành chính và học kỳ, hệ thống sẽ tự động tạo các lớp học phần tương ứng.",
  })
  async generateSectionsForClass(
    @Query("classId", ParseIntPipe) classId: number,
    @Query("semesterId", ParseIntPipe) semesterId: number,
  ) {
    return await this.courseOfferService.generateSectionForClass(
      classId,
      semesterId,
    );
  }

  @Get(":id")
  @ApiOperation({ summary: "Lấy chi tiết lớp học phần" })
  @ApiResponse({ status: 200, type: CourseOfferDetailResponseDto })
  async getDetail(@Param("id", ParseIntPipe) id: number) {
    return await this.courseOfferService.getCourseOfferDetail(id);
  }

  @Get(":id/export-excel")
  async exportExcel(
    @Param("id", ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    try {
      // 1. Gọi service để xử lý và nhận về file dạng Buffer
      const fileBuffer = await this.courseOfferService.exportToExcel(id);
      const fileName = `bangdiem_lophocphan_${id}.xlsx`;

      // 2. Thiết lập các HTTP Header cần thiết cho việc tải file mẫu Excel (.xlsx)
      res.set({
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": fileBuffer.byteLength,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      });

      res.end(fileBuffer);
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message:
          error.message || "Đã xảy ra lỗi trong quá trình xuất file Excel",
      });
    }
  }
}
