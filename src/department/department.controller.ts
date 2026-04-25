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
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { DepartmentService } from "./department.service";
import { CreateDepartmentDto, UpdateDepartmentDto } from "./department.dto";

@ApiTags("Departments") // Nhóm các API này lại trong giao diện Swagger
@Controller("departments")
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post()
  @ApiOperation({ summary: "Tạo mới một phòng ban" })
  @ApiResponse({ status: 201, description: "Tạo thành công." })
  @ApiResponse({ status: 409, description: "Mã phòng ban đã tồn tại." })
  create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentService.createDepartment(createDepartmentDto);
  }

  @Get()
  @ApiOperation({ summary: "Lấy danh sách tất cả phòng ban" })
  findAll() {
    return this.departmentService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Lấy chi tiết một phòng ban theo ID" })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.departmentService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Cập nhật thông tin phòng ban" })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    return this.departmentService.updateDepartment(id, updateDepartmentDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Xóa một phòng ban" })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.departmentService.remove(id);
  }
}
