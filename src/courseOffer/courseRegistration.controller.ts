import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from "@nestjs/swagger";
import { CourseRegistrationService } from "./CourseRegistration.service";
import { CreateCourseRegistrationDto } from "./CourseRegistration.dto";

@ApiTags("Đăng ký học phần (Course Registration)")
@Controller("course-registrations")
export class CourseRegistrationController {
  constructor(
    private readonly registrationService: CourseRegistrationService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Sinh viên đăng ký lớp học phần mới" })
  @ApiResponse({
    status: 201,
    description: "Đăng ký thành công, sĩ số lớp đã được cập nhật.",
  })
  @ApiResponse({
    status: 400,
    description:
      "Dữ liệu không hợp lệ (Lớp đầy, hết hạn đăng ký, hoặc trạng thái lớp chưa mở).",
  })
  @ApiResponse({
    status: 404,
    description: "Không tìm thấy Sinh viên hoặc Lớp học phần.",
  })
  @ApiResponse({
    status: 409,
    description: "Sinh viên đã đăng ký lớp học phần này trước đó.",
  })
  async create(@Body() createDto: CreateCourseRegistrationDto) {
    return await this.registrationService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: "Lấy danh sách tất cả các bản ghi đăng ký (Admin/Quản lý)",
  })
  @ApiResponse({
    status: 200,
    description:
      "Trả về danh sách đăng ký học phần kèm thông tin tối giản của SV và Lớp.",
  })
  async findAll() {
    return await this.registrationService.getAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Xem chi tiết thông tin đăng ký theo ID" })
  @ApiParam({ name: "id", description: "ID của bản ghi đăng ký", example: 1 })
  @ApiResponse({
    status: 200,
    description:
      "Trả về chi tiết đầy đủ bao gồm Môn học, Học kỳ và thông tin Sinh viên.",
  })
  @ApiResponse({
    status: 404,
    description: "Không tìm thấy ID đăng ký.",
  })
  async findOne(@Param("id", ParseIntPipe) id: number) {
    return await this.registrationService.getDetail(id);
  }
}
