import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from "@nestjs/swagger";
import { TeacherSubjectService } from "./teacherSubject.service";
import {
  CreateTeacherSubjectDto,
  CreateTeacherSubjectManyDto,
  TeacherSubjectResponseDto,
  UpdateTeacherSubjectDto,
} from "./teacherSubject.dto";

@ApiTags("Teacher Subjects (Phân Công Môn Học)")
@Controller("teacher-subjects")
export class TeacherSubjectController {
  constructor(private readonly teacherSubjectService: TeacherSubjectService) {}

  @Post()
  @ApiOperation({ summary: "Phân công môn học cho giáo viên" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: TeacherSubjectResponseDto,
  })
  async create(
    @Body() createDto: CreateTeacherSubjectDto,
  ): Promise<TeacherSubjectResponseDto> {
    return this.teacherSubjectService.create(createDto);
  }

  @Post("batch")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Phân công nhiều môn học cho giáo viên cùng lúc",
    description:
      "Hỗ trợ lưu hàng loạt môn học từ modal chọn môn của Frontend. Tự động bỏ qua các môn đã được phân công trước đó.",
  })
  @ApiBody({ type: CreateTeacherSubjectManyDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: [TeacherSubjectResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      "Dữ liệu đầu vào không hợp lệ hoặc tất cả các môn học đã được phân công từ trước.",
  })
  async createMany(
    @Body() body: CreateTeacherSubjectManyDto,
  ): Promise<TeacherSubjectResponseDto[]> {
    return this.teacherSubjectService.createMany(body);
  }

  @Get()
  @ApiOperation({ summary: "Lấy danh sách tất cả các phân công môn học" })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [TeacherSubjectResponseDto],
  })
  async findAll(): Promise<TeacherSubjectResponseDto[]> {
    return this.teacherSubjectService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Lấy chi tiết một phân công theo ID bản ghi" })
  @ApiParam({
    name: "id",
    description: "ID của bản ghi phân công",
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Thông tin chi tiết phân công.",
    type: TeacherSubjectResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Không tìm thấy ID phân công.",
  })
  async findOne(
    @Param("id", ParseIntPipe) id: number,
  ): Promise<TeacherSubjectResponseDto> {
    return this.teacherSubjectService.findOne(id);
  }

  @Get("teacher/:teacherId")
  @ApiOperation({
    summary: "Lấy danh sách tất cả môn học của một giáo viên cụ thể",
  })
  @ApiParam({
    name: "teacherId",
    description: "ID của giáo viên (Staff ID)",
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Danh sách môn học của giáo viên.",
    type: [TeacherSubjectResponseDto],
  })
  async findByTeacher(
    @Param("teacherId", ParseIntPipe) teacherId: number,
  ): Promise<TeacherSubjectResponseDto[]> {
    return this.teacherSubjectService.findByTeacher(teacherId);
  }

  @Put(":id")
  @ApiOperation({ summary: "Cập nhật phân công theo ID" })
  @ApiParam({
    name: "id",
    description: "ID của bản ghi phân công cần sửa",
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Cập nhật thành công.",
    type: TeacherSubjectResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Dữ liệu không hợp lệ hoặc bị trùng lặp.",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Không tìm thấy ID phân công.",
  })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateTeacherSubjectDto,
  ): Promise<TeacherSubjectResponseDto> {
    return this.teacherSubjectService.update(id, updateDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Xóa phân công theo ID" })
  @ApiParam({
    name: "id",
    description: "ID của bản ghi phân công cần xóa",
    type: Number,
  })
  @ApiResponse({ status: HttpStatus.OK, description: "Xóa thành công." })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Không tìm thấy ID phân công.",
  })
  async remove(@Param("id", ParseIntPipe) id: number) {
    return this.teacherSubjectService.remove(id);
  }

  @Delete("remove-pair/:teacherId/:subjectId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Hủy phân công dựa theo cặp trùng mã Giáo viên & Môn học (Không cần ID bảng trung gian)",
  })
  @ApiParam({
    name: "teacherId",
    description: "ID của Giáo viên",
    type: Number,
  })
  @ApiParam({ name: "subjectId", description: "ID của Môn học", type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Hủy phân công thành công.",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Không tìm thấy dữ liệu phân công phù hợp.",
  })
  async removeByUniquePair(
    @Param("teacherId", ParseIntPipe) teacherId: number,
    @Param("subjectId", ParseIntPipe) subjectId: number,
  ) {
    return this.teacherSubjectService.removeByUniquePair(teacherId, subjectId);
  }
}
