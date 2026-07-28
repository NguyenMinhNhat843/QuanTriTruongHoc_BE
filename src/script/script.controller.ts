import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Body,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiResponse } from "@nestjs/swagger";
import { GradeImportService } from "./script.service";
import { ImportAssessmentDto } from "./dto";

@ApiTags("Script")
@Controller("script")
export class GradeImportController {
  constructor(private readonly gradeImportService: GradeImportService) {}

  @Post("import-grade")
  @ApiOperation({ summary: "Import điểm của các môn học từ file Excel" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
          description: "File Excel danh sách điểm (Định dạng .xlsx)",
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor("file"))
  async importGrades(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("Vui lòng chọn một file excel để tải lên!");
    }

    // Kiểm tra định dạng file (chỉ chấp nhận xlsx)
    if (!file.originalname.match(/\.(xlsx)$/)) {
      throw new BadRequestException("Chỉ chấp nhận file Excel định dạng .xlsx!");
    }

    try {
      const results = await this.gradeImportService.importGradesFromExcel(file.buffer);
      return {
        success: true,
        message: "Import hoàn tất!",
        results,
      };
    } catch (error: any) {
      return {
        success: false,
        message: "Có lỗi xảy ra khi xử lý file Excel",
      };
    }
  }

  @Post("import")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Import điểm rèn luyện từ file Excel tổng hợp",
    description: `
    Hệ thống sẽ thực hiện đọc dữ liệu từ File Excel bắt đầu từ dòng số 10.
    - Đối chiếu mã học sinh (Cột B) với cơ sở dữ liệu.
    - Lấy điểm tổng học sinh tự chấm (Cột E) và điểm giáo viên chấm (Cột G).
    - Tự động phân bổ/rải đều điểm số này xuống các tiêu chí chi tiết (AssessmentDetail) của đợt đánh giá từ trên xuống dưới cho khớp chính xác với điểm tổng.
    `,
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    description: "Dữ liệu File Excel và ID đợt đánh giá",
    type: ImportAssessmentDto,
  })
  @ApiResponse({
    status: 200,
    description: "Import thành công hoặc hoàn tất quá trình kiểm thử import.",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Hoàn thành quá trình import điểm rèn luyện!",
        },
        data: {
          type: "object",
          properties: {
            successCount: { type: "integer", example: 35 },
            failedCount: { type: "integer", example: 2 },
            errors: {
              type: "array",
              items: { type: "string" },
              example: ["Dòng 12: Không tìm thấy HS có mã [24206099] trong database."],
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Lỗi định dạng File, không tìm thấy Đợt đánh giá, hoặc thiếu dữ liệu bắt buộc.",
  })
  @UseInterceptors(FileInterceptor("file"))
  async importAssessments(@UploadedFile() file: Express.Multer.File, @Body() body: ImportAssessmentDto) {
    if (!file) {
      throw new BadRequestException("Vui lòng chọn file Excel để tải lên!");
    }

    // Kiểm tra định dạng file (chỉ nhận file .xlsx / Excel)
    const allowedMimeTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException("Định dạng file không hợp lệ! Vui lòng tải lên file Excel (.xlsx).");
    }

    return this.gradeImportService.importAssessmentFromExcel(file.buffer, body.periodId);
  }
}
