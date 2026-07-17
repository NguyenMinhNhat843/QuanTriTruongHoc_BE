import {
  Controller,
  Get,
  HttpStatus,
  ParseIntPipe,
  Query,
  Res,
} from "@nestjs/common";
import { ApiTags, ApiQuery } from "@nestjs/swagger";
import { Response } from "express";
import { ExportGradeTableSummaryService } from "../service/exportGradeSummary.service";

@ApiTags("Export Grade Table - Xuất bảng điểm")
@Controller("export-grade-table")
export class ExportGradeTableController {
  constructor(
    private readonly exportGradeTableSummary: ExportGradeTableSummaryService,
  ) {}

  @Get("comprehensive/export-excel")
  @ApiQuery({ name: "classId", type: Number, description: "ID của lớp học" })
  @ApiQuery({
    name: "batchId",
    type: Number,
    description: "ID của khóa học/niên khóa",
  })
  async exportExcelGradeComprehensive(
    @Query("classId", ParseIntPipe) classId: number,
    @Query("batchId", ParseIntPipe) batchId: number,
    @Res() res: Response,
  ) {
    try {
      // Gọi service xử lý tạo buffer đa sheet đã viết
      const buffer =
        await this.exportGradeTableSummary.exportClassComprehensiveTranscripts(
          classId,
          batchId,
        );

      // Cấu hình Header trả file về cho Browser
      res.status(HttpStatus.OK).set({
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=Bang_Diem_Tong_Hop.xlsx`,
        "Content-Length": buffer.length,
      });

      res.end(buffer);
    } catch (error: any) {
      if (error.status === HttpStatus.NOT_FOUND) {
        return res.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          message:
            error.message || "Không tìm thấy dữ liệu lớp hoặc khóa học phù hợp",
        });
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "Đã xảy ra lỗi hệ thống khi xuất file Excel tổng hợp",
        error: error.message,
      });
    }
  }
}
