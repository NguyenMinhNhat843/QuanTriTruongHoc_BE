import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
} from "@nestjs/swagger";
import { ClassService } from "./class.service";
import { AssignClassDto, CreateClassDto, UpdateClassDto } from "./class.dto";
import { ClassResponseDto } from "./class.response";

@ApiTags("Classes")
@Controller("classes")
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  @Post("auto-assign")
  @ApiOperation({ summary: "Tự động phân lớp cho sinh viên mới" })
  async autoAssign(@Body() dto: AssignClassDto) {
    return await this.classService.assignStudentsToClass(
      dto.majorId,
      dto.batchId,
      dto.maxStudents,
    );
  }

  @Post()
  @ApiOperation({ summary: "Tạo mới lớp học" })
  @ApiCreatedResponse({ type: ClassResponseDto })
  create(@Body() createClassDto: CreateClassDto) {
    return this.classService.create(createClassDto);
  }

  @Get()
  @ApiOperation({ summary: "Lấy danh sách tất cả lớp học" })
  @ApiOkResponse({ type: ClassResponseDto, isArray: true })
  findAll() {
    return this.classService.findAll();
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
