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
  UseGuards,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiOkResponse, ApiResponse, ApiBody, ApiBearerAuth } from "@nestjs/swagger";
import { StudentService } from "./student.service.js";
import {
  AssignStudentsToClassesDto,
  CreateStudentDto,
  GetEligibleStudentsDto,
  SearchStudentDto,
  UpdateStudentDto,
} from "./dto/student.dto.js";
import { ResponseStudentPaginationDto, StudentResponseDto } from "./dto/student.response.js";
import { JwtAuthGuard } from "../auth/guard/jwt-auth.guard.js";
import { GetUser } from "../common/decorators/get-user.decorator.js";
import { RolesGuard } from "../auth/guard/role.guard.js";
import { Roles } from "../common/decorators/role.decorator.js";
import { RoleType } from "../../prisma/generated/prisma/enums.js";

@ApiTags("Students")
@ApiBearerAuth()
@Controller("students")
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  @Roles(RoleType.admin, RoleType.staff)
  @ApiOperation({
    summary: "Tạo mới hồ sơ sinh viên",
    operationId: "createStudent",
  })
  async create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentService.create(createStudentDto);
  }

  // Tạo nhiều sinh viên cùng lúc
  @Post("/bulk")
  @Roles(RoleType.admin, RoleType.staff)
  @ApiOperation({
    summary: "Tạo nhiều hồ sơ sinh viên cùng lúc",
    operationId: "createManyStudents",
  })
  @ApiBody({
    type: [CreateStudentDto],
  })
  async createMany(@Body() createStudentDtos: CreateStudentDto[]) {
    return this.studentService.createManyStudents(createStudentDtos);
  }

  // delete student by id
  @Delete(":id")
  @ApiOperation({
    summary: "Xóa hồ sơ sinh viên",
    operationId: "deleteStudent",
  })
  @ApiOkResponse({ description: "Hồ sơ sinh viên đã được xóa" })
  async deleteStudentById(@Param("id", ParseIntPipe) id: number) {
    return this.studentService.deleteStudentById(id);
  }

  @Get("/")
  @ApiOperation({
    summary: "Tìm kiếm và phân trang danh sách sinh viên",
    operationId: "searchStudents",
  })
  @ApiResponse({ status: 200, type: ResponseStudentPaginationDto })
  async searchStudent(@Query() query: SearchStudentDto) {
    return this.studentService.searchStudents(query);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Lấy profile của sinh viên hiện tại dựa trên token JWT",
  })
  @ApiOkResponse({ type: StudentResponseDto })
  async getMe(@GetUser() user: any) {
    if (user.role !== "student" || !user.studentId) {
      throw new UnauthorizedException("Tài khoản của bạn không có quyền truy cập thông tin sinh viên");
    }

    return this.studentService.findOne({
      id: user.studentId,
    });
  }

  @Get("search-by-code")
  @ApiOperation({
    summary: "Tìm sinh viên theo mã sinh viên",
    operationId: "findStudentByStudentCode",
  })
  @ApiOkResponse({ type: StudentResponseDto })
  async findByStudentCode(@Query("studentCode") studentCode: string): Promise<StudentResponseDto> {
    return this.studentService.findOne({
      studentCode,
    });
  }

  @Get("eligible-for-assignment")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Lấy danh sách học sinh đủ điều kiện phân lớp",
  })
  @ApiResponse({
    status: 200,
    description: "Lấy danh sách học sinh thành công.",
  })
  async getEligibleStudentsForAssignment(@Query() query: GetEligibleStudentsDto) {
    return await this.studentService.getEligibleStudentsForAssignment(query.batchId);
  }

  @Patch("assign-classes")
  @Roles(RoleType.admin, RoleType.staff)
  @ApiOperation({
    summary: "Phân lớp cho sinh viên",
    operationId: "assignStudentsToClasses",
  })
  async assignStudentsToClasses(@Body() body: AssignStudentsToClassesDto) {
    return this.studentService.assignStudentsToClasses(body);
  }

  @Patch(":id")
  @Roles(RoleType.admin, RoleType.staff)
  @ApiOperation({
    summary: "Cập nhật thông tin hồ sơ sinh viên",
  })
  async update(@Param("id", ParseIntPipe) id: number, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentService.update(id, updateStudentDto);
  }
}
