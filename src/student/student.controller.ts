import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  ParseIntPipe,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiOkResponse } from "@nestjs/swagger";
import { StudentService } from "./student.service.js";
import {
  CreateStudentDto,
  SearchStudentDto,
  UpdateStudentDto,
} from "./student.dto.js";
import { StudentResponseDto } from "./student.response.js";
import {
  ApiOkResponsePaginated,
  ResponsePagination,
} from "../common/common.response.js";

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

  @Get()
  @ApiOperation({
    summary: "Tìm kiếm và phân trang danh sách sinh viên",
    operationId: "searchStudents", // Orval sẽ gen ra: searchStudents()
  })
  @ApiOkResponsePaginated(StudentResponseDto)
  async searchStudent(
    @Query() query: SearchStudentDto,
  ): Promise<ResponsePagination<StudentResponseDto>> {
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
}
