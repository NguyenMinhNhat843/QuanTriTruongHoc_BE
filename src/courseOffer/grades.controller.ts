import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from "@nestjs/swagger";
import { CourseRegistrationService } from "./grades.service";
import { SaveGradesDto } from "./grades.dto";

@ApiTags("Đăng ký học phần (Course Registration)")
@Controller("course-registrations")
export class CourseRegistrationController {
  constructor(
    private readonly registrationService: CourseRegistrationService,
  ) {}

  @Post(":classSubjectId")
  @ApiOperation({
    summary: "Tạo bảng điểm cho một ClassSubject (Admin/Quản lý)",
  })
  async createGradesForClassSubject(
    @Query("classId", ParseIntPipe) classId: number,
    @Param("classSubjectId", ParseIntPipe) classSubjectId: number,
  ) {
    return await this.registrationService.createGradeTable(
      classId,
      classSubjectId,
    );
  }

  @Get()
  @ApiOperation({
    summary: "Lấy bảng điểm (Admin/Quản lý)",
  })
  @ApiResponse({
    status: 200,
  })
  async findAll() {
    return await this.registrationService.getAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Xem chi tiết thông tin điểm 1 học sinh theo ID" })
  @ApiParam({ name: "id", description: "ID của bản ghi bảng điểm", example: 1 })
  @ApiResponse({
    status: 200,
  })
  async findOne(@Param("id", ParseIntPipe) id: number) {
    return await this.registrationService.getDetail(id);
  }

  @Patch("save-grades")
  @ApiOperation({ summary: "Lưu bảng điểm cho một ClassSubject" })
  async saveGrades(@Body() data: SaveGradesDto) {
    return await this.registrationService.saveGradeTable(data);
  }
}
