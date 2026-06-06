import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { ClassSubjectService } from "./classSubject.service";

import { Response } from "express";
import {
  ClassSubjectResponseDto,
  CourseOfferDto,
  ResponsePreviewGenerateSectionForClass,
} from "./classSubject.response";
import {
  ExportGradeTableDto,
  SearchClassSubjectDto,
  updateClassSubjectDto,
} from "./classSubject.dto";
import { ExportGradeTableService } from "./exportGrades.service";
import { ClassSubjectGenerateService } from "./classSubjectGenerate.service";
import { CourseOfferDetailResponseDto } from "./classSubjectDetail.response";

@ApiTags("ClassSubject - Môn học trong lớp học")
@Controller("course-offers")
export class ClassSubjectController {
  constructor(
    private readonly classSubjectService: ClassSubjectService,
    private readonly classSubjectGenerateService: ClassSubjectGenerateService,
    private exportGradeTableService: ExportGradeTableService,
  ) {}

  /**
   * Lấy danh sách môn học trong lớp học
   */
  @Get()
  @ApiOperation({ summary: "Lấy danh sách Môn học trong lớp học" })
  @ApiResponse({
    status: 200,
    type: [ClassSubjectResponseDto],
  })
  async getAll(@Query() query: SearchClassSubjectDto) {
    return this.classSubjectService.findAll(query);
  }

  /**
   * Cập nhật môn học trong lớp học
   */
  @Patch(":id")
  @ApiOperation({ summary: "Cập nhật môn học trong lớp học" })
  @ApiResponse({
    type: CourseOfferDto,
  })
  async updateClassSubject(
    @Param("id", ParseIntPipe) classSubjectId: number,
    @Body() updateData: updateClassSubjectDto,
  ) {
    return await this.classSubjectService.updateClassSubject(
      classSubjectId,
      updateData,
    );
  }

  /**
   * Xem trước danh sách ClassSubject sẽ sinh trong 1 học kỳ theo chương trình khung của 1 Class
   */
  @Get("previewpreviewGenerateSectionForClass")
  @ApiOperation({
    summary: "Xem trước danh sách lớp học phần tự động",
  })
  @ApiResponse({
    status: 200,
    description: "Lấy dữ liệu cấu trúc xem trước thành công.",
    type: [ResponsePreviewGenerateSectionForClass],
  })
  async previewGenerateSectionForClass(
    @Query("classId", ParseIntPipe) classId: number,
    @Query("semesterId", ParseIntPipe) semesterId: number,
  ) {
    return this.classSubjectService.previewGenerateSectionForClass(
      classId,
      semesterId,
    );
  }

  /**
   * Tạo danh sách classSUbject cho toàn bộ lớp học trong 1 học kỳ dựa trên chương trình khung
   */
  @Post("gen-classSubject")
  @ApiOperation({
    summary: "Tự động tạo classSubject cho toàn bộ lớp học",
  })
  async generateClassSubject(
    @Query("semesterId", ParseIntPipe) semesterId: number,
  ) {
    return await this.classSubjectGenerateService.generateClassSubjectBySemester(
      semesterId,
    );
  }

  /**
   * Tạo danh sách classSubject cho 1 class trong 1 semester
   */
  @Post("gen-classSubject-grades")
  @ApiOperation({
    summary: "Tự động tạo classSubject cho một lớp hành chính",
  })
  async generateSectionsForClass(
    @Query("classId", ParseIntPipe) classId: number,
    @Query("semesterId", ParseIntPipe) semesterId: number,
  ) {
    return await this.classSubjectService.generateSectionForClass(
      classId,
      semesterId,
    );
  }

  /**
   * Phân công giáo viên giảng dạy cho từng lớp
   */
  @Post("assign-teacher")
  @ApiOperation({ summary: "Phân công giáo viên giảng dạy cho từng lớp" })
  @ApiResponse({
    status: 200,
  })
  async assignTeacher(@Body() body: SearchClassSubjectDto) {
    return await this.classSubjectService.assignTeacher(body);
  }

  /**
   * Lấy chi tiết classSubject, bao gồm bảng điểm của lớp đó
   */
  @Get(":id")
  @ApiOperation({ summary: "Lấy chi tiết môn học trong lớp học" })
  @ApiResponse({ status: 200, type: CourseOfferDetailResponseDto })
  async getDetail(@Param("id", ParseIntPipe) id: number) {
    return await this.classSubjectService.getCourseOfferDetail(id);
  }

  /**
   * Xuất file excel bảng điểm
   */
  @Post("/export-excel")
  async exportExcel(@Body() body: ExportGradeTableDto, @Res() res: Response) {
    try {
      const fileBuffer =
        await this.exportGradeTableService.exportMultipleSubjectsToExcel(
          body.classSubjectIds,
          body.haveTongKetSheet,
        );
      const fileName = `bangdiem_lophocphan.xlsx`;

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

  /**
   * API xuất bảng điểm Excel cho một học sinh từ đầu kỳ tới giờ
   * @route GET /grades/student/:id/export-excel
   */
  @Get("student/:id/export-excel")
  async exportExcelGradeForOneStudent(
    @Param("id", ParseIntPipe) studentId: number,
    @Res() res: Response,
  ) {
    try {
      const buffer =
        await this.exportGradeTableService.exportExcelGradeForOneStudent(
          studentId,
        );

      res.status(HttpStatus.OK).set({
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=Bang_Diem_Hoc_Sinh_${studentId}.xlsx`,
        "Content-Length": buffer.length,
      });

      res.end(buffer);
    } catch (error: any) {
      if (error.status === HttpStatus.NOT_FOUND) {
        return res.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          message: error.message || "Không tìm thấy dữ liệu học sinh",
        });
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "Đã xảy ra lỗi hệ thống khi xuất file Excel",
        error: error.message,
      });
    }
  }
}
