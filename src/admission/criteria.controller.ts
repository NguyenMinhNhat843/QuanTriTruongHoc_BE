import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  ClassSerializerInterceptor,
  HttpStatus,
  Get,
  Delete,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCreatedResponse,
} from "@nestjs/swagger";
import { CriterionService } from "./criteria.service";
import { CriterionResponseDto } from "./admission.response";
import { CreateCriterionDto } from "./admission.dto";
import { DeleteCriterionDto } from "./criteria.dto";

@ApiTags("Criteria - Danh mục Tiêu chí ")
@Controller("criteria")
// Interceptor này giúp tự động format response dựa trên các @Expose() trong DTO
@UseInterceptors(ClassSerializerInterceptor)
export class CriterionController {
  constructor(private readonly criterionService: CriterionService) {}

  @Post()
  @ApiOperation({
    summary: "Tạo mới tiêu chí tuyển sinh",
    description:
      "Tạo một tiêu chí mẫu (Ví dụ: IELTS, Điểm Toán) để dùng chung cho các ngành học.",
  })
  @ApiCreatedResponse({
    description: "Tiêu chí đã được tạo thành công",
    type: CriterionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: "Tên tiêu chí đã tồn tại",
  })
  async create(
    @Body() createDto: CreateCriterionDto,
  ): Promise<CriterionResponseDto> {
    return this.criterionService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: "Lấy danh sách tiêu chí",
    description: "Hỗ trợ tìm kiếm theo tên và phân trang.",
  })
  @ApiResponse({
    status: 200,
    description: "Danh sách tiêu chí kèm metadata phân trang",
    type: [CriterionResponseDto],
  })
  async findAll() {
    return this.criterionService.findAll();
  }

  @Delete()
  @ApiOperation({
    summary: "Xóa tiêu chí",
    description: "Xóa một tiêu chí theo ID.",
  })
  @ApiResponse({
    status: 200,
    description: "Tiêu chí đã được xóa thành công",
  })
  async deleteCriteria(@Body() deleteDto: DeleteCriterionDto) {
    await this.criterionService.deleteCriteria(deleteDto);
  }
}
