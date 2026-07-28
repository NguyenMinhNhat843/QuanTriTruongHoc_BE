import { Controller, Post, Param, ParseIntPipe, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from "@nestjs/swagger";
import { AdmissionImportService } from "./insert-profile-admission";

@ApiTags("Admission Import (Dev/Testing)") // Nhóm API trong Swagger UI
@Controller("script")
export class AdmissionImportController {
  constructor(private readonly admissionImportService: AdmissionImportService) {}

  @Post("mock-excel/:campaignMajorId")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Import danh sách hồ sơ học sinh mẫu (Data cứng Excel) vào Ngành tuyển sinh",
    description: "API tự động tạo 16 hồ sơ học sinh từ danh sách mẫu, điểm auto 10 và hạnh kiểm auto TỐT.",
  })
  @ApiParam({
    name: "campaignMajorId",
    type: Number,
    description: "ID của AdmissionCampaignMajor (Ngành + Đợt tuyển sinh)",
    example: 1,
  })
  @ApiResponse({
    status: 201,
    description: "Import thành công danh sách hồ sơ mẫu.",
  })
  @ApiResponse({
    status: 404,
    description: "Không tìm thấy AdmissionCampaignMajor với ID truyền vào.",
  })
  @ApiResponse({
    status: 400,
    description: "Cấu hình Tổ hợp môn của ngành này chưa hợp lệ (thiếu danh sách môn).",
  })
  async importMockData(@Param("campaignMajorId", ParseIntPipe) campaignMajorId: number) {
    return await this.admissionImportService.importProfilesFromMockData(campaignMajorId);
  }
}
