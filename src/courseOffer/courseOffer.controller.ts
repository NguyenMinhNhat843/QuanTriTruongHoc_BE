import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { CourseOfferService } from "./courseOffer.service";
import {
  CreateBulkCourseOfferDto,
  CreateOptionalCourseOfferDto,
  PreviewCourseOfferDto,
} from "./courseOffer.dto";
import { StudentResponseDto } from "../student/student.response";
import { CourseOfferDetailResponseDto } from "./courseOfferDetail.response";

@ApiTags("CourseOffer - Lớp học phần")
@Controller("course-offers")
export class CourseOfferController {
  constructor(private readonly courseOfferService: CourseOfferService) {}

  @Get()
  @ApiOperation({ summary: "Lấy danh sách tất cả lớp học phần" })
  @ApiResponse({ status: 200, description: "Danh sách lớp học phần" })
  async getAll() {
    return this.courseOfferService.getAllCourseOffers();
  }

  @Get("preview")
  @ApiOperation({
    summary: "Xem trước danh sách lớp học phần sẽ tạo",
    description:
      "Dựa trên Học kỳ, Ngành và Khóa để tính toán số lớp từ Chương trình khung",
  })
  @ApiResponse({ status: 200, description: "Danh sách dự kiến" })
  @UsePipes(new ValidationPipe({ transform: true }))
  preview(@Query() dto: PreviewCourseOfferDto) {
    return this.courseOfferService.previewSections(dto);
  }

  @Post("generate")
  @ApiOperation({ summary: "Thực thi tạo lớp học phần hàng loạt" })
  @ApiResponse({ status: 201, description: "Khởi tạo thành công" })
  async generate(@Body() dto: CreateBulkCourseOfferDto) {
    return this.courseOfferService.generateSections(dto);
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

  // Phê duyệt lớp học phần
  @Patch(":id/approve")
  @ApiOperation({ summary: "Chấp nhận mở lớp học phần" })
  async approve(@Param("id", ParseIntPipe) id: number) {
    return await this.courseOfferService.approveCourseOffer(id);
  }

  // Lấy chi tiết
  @Get(":id")
  @ApiOperation({ summary: "Lấy chi tiết lớp học phần" })
  @ApiResponse({ status: 200, type: CourseOfferDetailResponseDto })
  async getDetail(@Param("id", ParseIntPipe) id: number) {
    return await this.courseOfferService.getCourseOfferDetail(id);
  }

  // Lấy danh sách học sinh đủ điều kiện đăng ký vào lớp học phần
  @Get(":courseOfferId/eligible-students")
  @ApiOperation({
    summary: "Lấy danh sách học sinh đủ điều kiện đăng ký vào lớp học phần",
  })
  @ApiResponse({
    type: StudentResponseDto,
  })
  async getEligibleStudents(
    @Param("courseOfferId", ParseIntPipe) courseOfferId: number,
  ) {
    return await this.courseOfferService.getEligibleStudentsForCourseOffer(
      courseOfferId,
    );
  }

  @Get(":courseOfferId/diem")
  @ApiOperation({
    summary: "Lấy điểm của 1 lớp",
  })
  async getDiemCua1Lop(
    @Param("courseOfferId", ParseIntPipe) courseOfferId: number,
  ) {
    return await this.courseOfferService.getDiemCua1Lop(courseOfferId);
  }
}
