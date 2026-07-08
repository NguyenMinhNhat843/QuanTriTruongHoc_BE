import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import {
  CreateTuitionPeriodDto,
  SearchTuitionPeriodDto,
  TuitionPeriodDto,
  UpdateTuitionPeriodDto,
} from "../dto/tuition-period.dto"; // Thay đổi đường dẫn import DTO cho đúng
import { TuitionPeriodService } from "../service/tuition-period.service";

@ApiTags("Tuition Periods") // Nhóm các API này lại trên giao diện Swagger UI
@Controller("tuition-periods")
export class TuitionPeriodController {
  constructor(private readonly tuitionPeriodService: TuitionPeriodService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Tạo mới một đợt thu học phí" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Tạo đợt thu học phí thành công.",
    type: TuitionPeriodDto,
  })
  create(@Body() createDto: CreateTuitionPeriodDto): Promise<TuitionPeriodDto> {
    return this.tuitionPeriodService.create(createDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Lấy danh sách đợt thu học phí (có lọc theo tên)" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Trả về danh sách các đợt thu học phí thỏa mãn điều kiện.",
    type: [TuitionPeriodDto], // Định nghĩa kiểu mảng cho Swagger
  })
  findAll(
    @Query() searchDto: SearchTuitionPeriodDto,
  ): Promise<TuitionPeriodDto[]> {
    return this.tuitionPeriodService.findAll(searchDto);
  }

  @Get(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Lấy thông tin chi tiết một đợt thu học phí" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Tìm thấy thông tin chi tiết đợt thu học phí.",
    type: TuitionPeriodDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Không tìm thấy ID yêu cầu.",
  })
  findOne(@Param("id", ParseIntPipe) id: number): Promise<TuitionPeriodDto> {
    return this.tuitionPeriodService.findOne(id);
  }

  @Patch(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Cập nhật thông tin đợt thu học phí" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Cập nhật thành công.",
    type: TuitionPeriodDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Không tìm thấy ID yêu cầu.",
  })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateTuitionPeriodDto,
  ): Promise<TuitionPeriodDto> {
    return this.tuitionPeriodService.update(id, updateDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Xóa một đợt thu học phí" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Xóa đợt thu học phí thành công.",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Deleted tuition period with ID 1 successfully",
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Không tìm thấy ID yêu cầu.",
  })
  remove(@Param("id", ParseIntPipe) id: number): Promise<{ message: string }> {
    return this.tuitionPeriodService.remove(id);
  }
}
