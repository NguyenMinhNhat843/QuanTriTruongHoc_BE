import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  ParseIntPipe,
  Delete,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiResponse,
  ApiBody,
} from "@nestjs/swagger";
import { StudentService } from "./student.service.js";
import {
  CreateStudentDto,
  SearchStudentDto,
  UpdateStudentDto,
} from "./student.dto.js";
import { StudentResponseDto } from "./student.response.js";

@ApiTags("Students")
@Controller("students")
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  @ApiOperation({
    summary: "Tạo mới hồ sơ sinh viên",
    operationId: "createStudent", // Orval sẽ gen ra: createStudent()
  })
  @ApiOkResponse({ type: StudentResponseDto })
  async create(
    @Body() createStudentDto: CreateStudentDto,
  ): Promise<StudentResponseDto> {
    return this.studentService.createStudent(createStudentDto);
  }

  // Tạo nhiều sinh viên cùng lúc
  @Post("/bulk")
  @ApiOperation({
    summary: "Tạo nhiều hồ sơ sinh viên cùng lúc",
    operationId: "createManyStudents",
  })
  @ApiBody({
    type: [CreateStudentDto],
    description: "Danh sách hồ sơ sinh viên cần tạo mới",
  })
  async createMany(@Body() createStudentDtos: CreateStudentDto[]) {
    return this.studentService.createManyStudents(createStudentDtos);
  }

  // delete student by id
  @Delete(":id")
  @ApiOperation({
    summary: "Xóa hồ sơ sinh viên",
    operationId: "deleteStudent", // Orval sẽ gen ra: deleteStudent()
  })
  @ApiOkResponse({ description: "Hồ sơ sinh viên đã được xóa" })
  async deleteStudentById(@Param("id", ParseIntPipe) id: number) {
    return this.studentService.deleteStudentById(id);
  }

  @Get()
  @ApiOperation({
    summary: "Tìm kiếm và phân trang danh sách sinh viên",
    operationId: "searchStudents", // Orval sẽ gen ra: searchStudents()
  })
  @ApiResponse({ status: 200, type: [StudentResponseDto] })
  // @ApiOkResponsePaginated(StudentResponseDto)
  async searchStudent(@Query() query: SearchStudentDto) {
    return this.studentService.searchStudents(query);
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Cập nhật thông tin hồ sơ sinh viên",
    operationId: "updateStudent", // Orval sẽ gen ra: updateStudent()
  })
  @ApiOkResponse({ type: StudentResponseDto })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateStudentDto: UpdateStudentDto,
  ): Promise<StudentResponseDto> {
    return this.studentService.updateStudent(id, updateStudentDto);
  }

  @Post(":id/approve")
  @ApiOperation({
    summary: "Duyệt hồ sơ và cấp tài khoản đăng nhập",
    operationId: "approveStudent", // Orval sẽ gen ra: approveStudent()
  })
  @ApiOkResponse({ type: StudentResponseDto })
  async approve(
    @Param("id", ParseIntPipe) id: number,
  ): Promise<StudentResponseDto> {
    return this.studentService.approveStudent(id);
  }

  @Get("search-by-code")
  @ApiOperation({
    summary: "Tìm sinh viên theo mã sinh viên",
    operationId: "findStudentByStudentCode",
  })
  @ApiOkResponse({ type: StudentResponseDto })
  async findByStudentCode(
    @Query("studentCode") studentCode: string,
  ): Promise<StudentResponseDto> {
    return this.studentService.findStudentByStudentCode(studentCode);
  }
}
