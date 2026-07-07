import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
} from "@nestjs/swagger";
import { ClassService } from "./class.service";
import { CreateClassDto, SearchClassDto, UpdateClassDto } from "./class.dto";
import {
  ClassResponseDto,
  ClassResponseWithRelationsDto,
} from "./class.response";
import { GetUser } from "../common/decorators/get-user.decorator";
import { JwtAuthGuard } from "../auth/guard/jwt-auth.guard";

@ApiTags("Classes")
@Controller("classes")
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  @Post()
  @ApiOperation({ summary: "Tạo mới lớp học" })
  @ApiCreatedResponse({ type: ClassResponseDto })
  create(@Body() createClassDto: CreateClassDto) {
    return this.classService.create(createClassDto);
  }

  /**
   * Search Lớp học
   */
  @Get()
  @ApiOperation({})
  @ApiOkResponse({ type: ClassResponseDto, isArray: true })
  @UseGuards(JwtAuthGuard)
  findAll(@Query() query: SearchClassDto, @GetUser() user: any) {
    return this.classService.findAll(query, user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Lấy chi tiết lớp học theo ID" })
  @ApiOkResponse({ type: ClassResponseWithRelationsDto })
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
