import { Body, Controller, Delete, Get, Param, ParseArrayPipe, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import {
  CreateStudentExamDetailDto,
  SearchStudentExamDetailDto,
  StudentExamDetailDetailDto,
  UpdateStudentExamDetailDto,
} from "../dto/student-exam-detail.dto";
import { StudentExamDetailService } from "../service/student-exam-detail.service";

@ApiTags("Chi tiết Sinh viên Dự thi (Student Exam Detail)")
@Controller("student-exam-details")
export class StudentExamDetailController {
  constructor(private readonly studentExamDetailService: StudentExamDetailService) {}

  @Post()
  @ApiOperation({ summary: "Thêm 1 sinh viên vào danh sách phòng thi" })
  @ApiResponse({
    status: 201,
    description: "Thêm sinh viên vào phòng thi thành công.",
    type: StudentExamDetailDetailDto,
  })
  async create(@Body() createDto: CreateStudentExamDetailDto) {
    return this.studentExamDetailService.create(createDto);
  }

  @Post("bulk/:examScheduleId")
  @ApiOperation({ summary: "Thêm hàng loạt sinh viên vào phòng thi (Gán danh sách thi)" })
  @ApiResponse({ status: 201 })
  async createMany(
    @Param("examScheduleId", ParseIntPipe) examScheduleId: number,
    @Body("studentIds", new ParseArrayPipe({ items: Number }))
    studentIds: number[],
  ) {
    return this.studentExamDetailService.createMany(examScheduleId, studentIds);
  }

  @Get()
  @ApiOperation({
    summary: "Lấy danh sách sinh viên dự thi (Có lọc & phân trang)",
  })
  @ApiResponse({
    status: 200,
    description: "Trả về danh sách sinh viên trong phòng thi kèm phân trang.",
  })
  async findAll(
    @Query() query: SearchStudentExamDetailDto,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.studentExamDetailService.findAll({
      ...query,
      page,
      limit,
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Lấy thông tin chi tiết sinh viên dự thi theo ID" })
  @ApiParam({ name: "id", type: Number, description: "ID của bản ghi" })
  @ApiResponse({
    status: 200,
    type: StudentExamDetailDetailDto,
  })
  async findOne(@Param("id", ParseIntPipe) id: number) {
    return this.studentExamDetailService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Cập nhật thông tin dự thi (Số báo danh, Số ghế, Điểm danh, Vi phạm)",
  })
  @ApiParam({ name: "id", type: Number, description: "ID của bản ghi" })
  @ApiResponse({
    status: 200,
    description: "Cập nhật thành công.",
    type: StudentExamDetailDetailDto,
  })
  async update(@Param("id", ParseIntPipe) id: number, @Body() updateDto: UpdateStudentExamDetailDto) {
    return this.studentExamDetailService.update(id, updateDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Xóa sinh viên khỏi phòng thi" })
  @ApiParam({ name: "id", type: Number, description: "ID của bản ghi" })
  @ApiResponse({
    status: 200,
    description: "Xóa thành công.",
  })
  async remove(@Param("id", ParseIntPipe) id: number) {
    return this.studentExamDetailService.remove(id);
  }
}
