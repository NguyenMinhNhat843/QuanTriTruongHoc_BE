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
import { ResponsePagination } from "../common/common.response.js";

@ApiTags("Students") // Phân nhóm trong Swagger
@Controller("students")
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  @ApiOperation({ summary: "Tạo mới hồ sơ sinh viên (Nộp hồ sơ)" })
  @ApiOkResponse({ type: StudentResponseDto })
  async create(
    @Body() createStudentDto: CreateStudentDto,
  ): Promise<StudentResponseDto> {
    return this.studentService.createStudent(createStudentDto);
  }

  @Get()
  @ApiOperation({ summary: "Tìm kiếm và phân trang danh sách sinh viên" })
  @ApiOkResponse({ description: "Danh sách sinh viên và thông tin phân trang" })
  async searchStudent(
    @Query() query: SearchStudentDto,
  ): Promise<ResponsePagination<StudentResponseDto>> {
    return this.studentService.searchStudents(query);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Cập nhật thông tin hồ sơ sinh viên" })
  @ApiOkResponse({ type: StudentResponseDto })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateStudentDto: UpdateStudentDto,
  ): Promise<StudentResponseDto> {
    return this.studentService.updateStudent(id, updateStudentDto);
  }

  /**
   * Lưu ý: Bạn nên tạo thêm một endpoint riêng cho việc duyệt hồ sơ (Approve)
   * vì nó chứa logic nghiệp vụ đặc biệt là tạo tài khoản User.
   */
  @Post(":id/approve")
  @ApiOperation({ summary: "Duyệt hồ sơ và cấp tài khoản đăng nhập" })
  @ApiOkResponse({ type: StudentResponseDto })
  async approve(
    @Param("id", ParseIntPipe) id: number,
  ): Promise<StudentResponseDto> {
    // Gọi hàm approve trong service (hàm này bạn sẽ bổ sung dựa trên logic
    // transaction tạo User và Student mà chúng ta đã thảo luận)
    return this.studentService.approveStudent(id);
  }
}
