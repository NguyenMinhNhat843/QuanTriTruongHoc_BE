import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpStatus,
  Query,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiResponse,
} from "@nestjs/swagger";
import { ClassService } from "./class.service";
import {
  AssignStudentsToClassesDto,
  CreateClassDto,
  EligibleStudentsResponseDto,
  RequestEligibleStudents,
  SearchClassDto,
  UpdateClassDto,
} from "./class.dto";
import { ClassResponseDto } from "./class.response";
import { ClassBusinessService } from "./class.business";

@ApiTags("Classes")
@Controller("classes")
export class ClassController {
  constructor(
    private readonly classService: ClassService,
    private classBusinessService: ClassBusinessService,
  ) {}

  @Post()
  @ApiOperation({ summary: "Tạo mới lớp học" })
  @ApiCreatedResponse({ type: ClassResponseDto })
  create(@Body() createClassDto: CreateClassDto) {
    return this.classService.create(createClassDto);
  }

  @Get()
  @ApiOperation({ summary: "Lấy danh sách tất cả lớp học" })
  @ApiOkResponse({ type: ClassResponseDto, isArray: true })
  findAll(@Query() query: SearchClassDto) {
    return this.classService.findAll(query);
  }

  @Post("/assign-classes")
  @ApiOperation({
    summary: "Tự động chia lớp danh nghĩa cho sinh viên chính thức",
    description:
      'Gom các sinh viên có trạng thái "studying" chưa có lớp thuộc Ngành và Khóa học được chỉ định để thực hiện thuật toán chia đều lớp dựa trên sĩ số tối đa.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Tự động xử lý phân phối lớp cho sinh viên thành công.",
  })
  async assignStudentsToClasses(@Body() body: AssignStudentsToClassesDto) {
    return await this.classBusinessService.assignStudentsToClasses(body);
  }

  @Get("/eligible-for-assignment")
  @ApiOperation({
    summary: "Lấy danh sách sinh viên đủ điều kiện phân lớp",
    description:
      'Danh sách sinh viên có trạng thái "studying" nhưng chưa có classId.',
  })
  @ApiResponse({
    status: 200,
    type: EligibleStudentsResponseDto,
  })
  async getEligibleStudents(@Query() query: RequestEligibleStudents) {
    return await this.classBusinessService.getEligibleStudentsForAssignment(
      query,
    );
  }

  @Get(":id")
  @ApiOperation({ summary: "Lấy chi tiết lớp học theo ID" })
  @ApiOkResponse({ type: ClassResponseDto })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.classService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Cập nhật thông tin lớp học" })
  @ApiOkResponse({ type: ClassResponseDto })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateClassDto: UpdateClassDto,
  ) {
    return this.classService.update(id, updateClassDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Xóa lớp học" })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.classService.remove(id);
  }
}
