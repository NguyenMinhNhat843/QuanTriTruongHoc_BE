import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiResponse, ApiOperation } from "@nestjs/swagger";
import { AcademicYearService } from "./academic-year.service";
import {
  AcademicYearDto,
  CreateAcademicYearDto,
  UpdateAcademicYearDto,
  SearchAcademicYearDto,
  ResponseAcademicYearPaginationDto,
} from "./academic-year.dto";

@ApiTags("Academic Years")
@Controller("academic-years")
export class AcademicYearController {
  constructor(private readonly academicYearService: AcademicYearService) {}

  @Post()
  @ApiOperation({ summary: "Tạo mới năm học" })
  @ApiResponse({ status: HttpStatus.CREATED, type: AcademicYearDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST })
  create(@Body() createDto: CreateAcademicYearDto) {
    return this.academicYearService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: "Danh sách năm học" })
  @ApiResponse({ status: HttpStatus.OK, type: ResponseAcademicYearPaginationDto })
  findAll(@Query() query: SearchAcademicYearDto) {
    return this.academicYearService.findAll(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Chi tiết năm học" })
  @ApiResponse({ status: HttpStatus.OK, type: AcademicYearDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.academicYearService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Cập nhật năm học" })
  @ApiResponse({ status: HttpStatus.OK, type: AcademicYearDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST })
  @ApiResponse({ status: HttpStatus.NOT_FOUND })
  update(@Param("id", ParseIntPipe) id: number, @Body() updateDto: UpdateAcademicYearDto) {
    return this.academicYearService.update(id, updateDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Xóa năm học" })
  @ApiResponse({ status: HttpStatus.OK, type: AcademicYearDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.academicYearService.remove(id);
  }
}
