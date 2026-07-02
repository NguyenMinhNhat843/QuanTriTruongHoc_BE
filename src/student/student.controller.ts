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
  ApprovedStudentDto,
  CreateStudentDto,
  SearchStudentDto,
  UpdateStudentDto,
} from "./dto/student.dto.js";
import {
  ResponseStudentPaginationDto,
  StudentResponseDto,
} from "./dto/student.response.js";
import {
  AssignStudentsToClassesDto,
  GetEligibleStudentsDtoForAssignment,
  GetEligibleStudentsDtoForAssignmentResponse,
} from "./dto/get-eligible-students.dto.js";
import { plainToInstance } from "class-transformer";

@ApiTags("Students")
@Controller("students")
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  @ApiOperation({
    summary: "Tạo mới hồ sơ sinh viên",
    operationId: "createStudent",
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
    console.log("query: ", query);
    return this.studentService.searchStudents(query);
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

  @Get("eligible-for-assignment")
  @ApiOperation({
    summary: "Lấy danh sách sinh viên đủ điều kiện phân lớp",
    operationId: "getEligibleStudentsForAssignment",
  })
  @ApiOkResponse({ type: [GetEligibleStudentsDtoForAssignmentResponse] })
  async getEligibleStudentsForAssignment(
    @Query() query: GetEligibleStudentsDtoForAssignment,
  ) {
    const { batchId } = query;
    if (!batchId) return [];
    const result =
      await this.studentService.getEligibleStudentsForAssignment(batchId);
    const resultFormat = result.students.map((student) => {
      return {
        student: {
          id: student.id,
          studentCode: student.studentCode,
          fullName: student.fullName,
        },
        batch: {
          id: student.batch?.id,
          batchCode: student.batch?.batchCode,
          batchName: student.batch?.batchName,
        },
      };
    });
    return plainToInstance(
      GetEligibleStudentsDtoForAssignmentResponse,
      resultFormat,
    );
  }

  @Patch("approve")
  @ApiOperation({
    summary: "Duyệt hồ sơ sinh viên",
    operationId: "approveStudent",
  })
  async approveStudents(@Body() body: ApprovedStudentDto) {
    return this.studentService.approveStudent(body);
  }

  @Patch("assign-classes")
  @ApiOperation({
    summary: "Phân lớp cho sinh viên",
    operationId: "assignStudentsToClasses",
  })
  async assignStudentsToClasses(@Body() body: AssignStudentsToClassesDto) {
    return this.studentService.assignStudentsToClasses(body);
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Cập nhật thông tin hồ sơ sinh viên",
    operationId: "updateStudent",
  })
  @ApiOkResponse({ type: StudentResponseDto })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateStudentDto: UpdateStudentDto,
  ): Promise<StudentResponseDto> {
    return this.studentService.updateStudent(id, updateStudentDto);
  }
}
