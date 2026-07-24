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
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

import { Response } from "express";
import {
  ClassSubjectDetailDto,
  ClassSubjectDto,
  ExportGradeTableDto,
  SearchClassSubjectDto,
  updateClassSubjectDto,
} from "../dto/classSubject.dto";
import { ExportGradeTableService } from "../service/exportGrades.service";
import { ClassSubjectService } from "../service/classSubject.service";
import { JwtAuthGuard } from "../../auth/guard/jwt-auth.guard";
import { GetUser } from "../../common/decorators/get-user.decorator";

@ApiTags("ClassSubject - Môn học trong lớp học")
@Controller("class-subject")
export class ClassSubjectController {
  constructor(
    private readonly classSubjectService: ClassSubjectService,
    private exportGradeTableService: ExportGradeTableService,
  ) {}

  /**
   * Cập nhật môn học trong lớp học
   */
  @Patch(":id")
  @ApiOperation({ summary: "Cập nhật môn học trong lớp học" })
  @ApiResponse({
    type: ClassSubjectDto,
  })
  async updateClassSubject(
    @Param("id", ParseIntPipe) classSubjectId: number,
    @Body() updateData: updateClassSubjectDto,
  ) {
    return await this.classSubjectService.updateClassSubject(classSubjectId, updateData);
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
    return await this.classSubjectService.generateSectionForClass(classId, semesterId);
  }

  /**
   * Xuất file excel bảng điểm
   */
  @Post("/export-excel")
  async exportExcel(@Body() body: ExportGradeTableDto, @Res() res: Response) {
    try {
      const fileBuffer = await this.exportGradeTableService.exportMultipleSubjectsToExcel(
        body.classSubjectIds,
        body.haveTongKetSheet,
      );

      const fileName = `bangdiem_lophocphan.xlsx`;

      res.set({
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": fileBuffer.byteLength,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      });

      return res.end(fileBuffer);
    } catch (error: any) {
      console.error("Error exporting excel grade table:", error);

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || "Đã xảy ra lỗi trong quá trình tự động khởi tạo file Excel",
      });
    }
  }

  /**
   * Lấy danh sách môn học trong lớp học
   */
  @Get()
  @ApiOperation({ summary: "Lấy danh sách Môn học trong lớp học" })
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 200,
    type: [ClassSubjectDetailDto],
  })
  async getAll(@Query() query: SearchClassSubjectDto, @GetUser() user: any) {
    return this.classSubjectService.findAll(query, user);
  }

  /**
   * API xuất bảng điểm Excel cho một học sinh từ đầu kỳ tới giờ
   * @route GET /grades/student/:id/export-excel
   */
  @Get("student/:id/export-excel")
  async exportExcelGradeForOneStudent(@Param("id", ParseIntPipe) studentId: number, @Res() res: Response) {
    try {
      const buffer = await this.exportGradeTableService.exportExcelGradeForOneStudent(studentId);

      res.status(HttpStatus.OK).set({
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
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

  /**
   * Lấy chi tiết classSubject, bao gồm bảng điểm của lớp đó
   */
  @Get(":id")
  @ApiOperation({ summary: "Lấy chi tiết môn học trong lớp học" })
  @ApiResponse({ status: 200, type: ClassSubjectDetailDto })
  async getDetail(@Param("id", ParseIntPipe) id: number) {
    return await this.classSubjectService.getCourseOfferDetail(id);
  }
}
