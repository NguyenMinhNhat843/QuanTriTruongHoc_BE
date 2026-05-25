import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { CourseOfferService } from "./courseOffer.service";
import {
  CreateBulkCourseOfferDto,
  CreateOptionalCourseOfferDto,
  SearchCourseOfferDto,
  updateClassSubjectDto,
} from "./courseOffer.dto";
import { CourseOfferDetailResponseDto } from "./courseOfferDetail.response";
import { Response } from "express";
import {
  CourseOfferDto,
  ResponsePreviewGenerateSectionForClass,
} from "./courseOffer.response";

@ApiTags("CourseOffer - Lớp học phần")
@Controller("course-offers")
export class CourseOfferController {
  constructor(private readonly courseOfferService: CourseOfferService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Lấy danh sách lớp học phần" })
  @ApiResponse({
    status: 200,
    type: [CourseOfferDto],
  })
  async getAll(@Query() query: SearchCourseOfferDto) {
    return this.courseOfferService.findAll(query);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Cập nhật thông tin lớp học phần" })
  @ApiResponse({ status: 200, type: CourseOfferDto })
  async updateClassSubject(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateData: updateClassSubjectDto,
  ) {
    return await this.courseOfferService.updateClassSubject(id, updateData);
  }

  @Get("preview")
  @ApiOperation({
    summary: "Xem trước danh sách lớp học phần sẽ tạo",
    description:
      "Dựa trên Học kỳ, Ngành và Khóa để tính toán số lớp từ Chương trình khung",
  })
  @ApiResponse({ status: 200, description: "Danh sách dự kiến" })
  preview(@Query() dto: CreateBulkCourseOfferDto) {
    return this.courseOfferService.previewGenClassSubjects(dto);
  }

  @Post("generate")
  @ApiOperation({ summary: "Thực thi tạo lớp học phần hàng loạt" })
  @ApiResponse({ status: 201, description: "Khởi tạo thành công" })
  async generate(@Body() dto: CreateBulkCourseOfferDto) {
    return this.courseOfferService.genClassSubjects(dto);
  }

  @Post("optional")
  @ApiOperation({
    summary: "Mở một lớp học phần tùy chọn (Học lại/Cải thiện)",
    description:
      "Cho phép admin chọn môn học và kỳ học bất kỳ để mở lớp mà không theo CTK",
  })
  @ApiResponse({ status: 201, description: "Tạo lớp thành công" })
  async createOptional(@Body() dto: CreateOptionalCourseOfferDto) {
    return this.courseOfferService.createOptionalSection(dto);
  }

  /**
   * API Xem trước danh sách lớp học phần sẽ sinh tự động
   */
  @Get("previewpreviewGenerateSectionForClass")
  @ApiOperation({
    summary: "Xem trước danh sách lớp học phần tự động",
    description:
      "Trả về danh sách các môn học kèm theo mã và tên lớp học phần dự kiến sẽ được sinh ra, kèm trạng thái đã tồn tại hay chưa.",
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
