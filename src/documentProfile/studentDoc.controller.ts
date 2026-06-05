import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import {
  CreateStudentDocumentDto,
  UpdateStudentDocumentDto,
  StudentDocumentResponseDto,
} from "./studentDoc.dto";
import { StudentDocumentService } from "./studentDoc.service";

@ApiTags("Student Document")
@Controller("student-documents")
export class StudentDocumentController {
  constructor(
    private readonly studentDocumentService: StudentDocumentService,
  ) {}

  @Post()
  @ApiOperation({ summary: "Tạo mới tài liệu sinh viên" })
  @ApiResponse({ status: 201, type: StudentDocumentResponseDto })
  async create(
    @Body() dto: CreateStudentDocumentDto,
  ): Promise<StudentDocumentResponseDto> {
    return this.studentDocumentService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "Lấy danh sách tất cả tài liệu sinh viên" })
  @ApiResponse({ status: 200, type: [StudentDocumentResponseDto] })
  async findAll(): Promise<StudentDocumentResponseDto[]> {
    return this.studentDocumentService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Lấy chi tiết tài liệu sinh viên theo ID" })
  @ApiResponse({ status: 200, type: StudentDocumentResponseDto })
  @ApiResponse({ status: 404 })
  async findOne(
    @Param("id", ParseIntPipe) id: number,
  ): Promise<StudentDocumentResponseDto> {
    return this.studentDocumentService.findOne(id);
  }

  @Put(":id")
  @ApiOperation({ summary: "Cập nhật tài liệu sinh viên theo ID" })
  @ApiResponse({ status: 200, type: StudentDocumentResponseDto })
  @ApiResponse({ status: 404 })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateStudentDocumentDto,
  ): Promise<StudentDocumentResponseDto> {
    return this.studentDocumentService.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Xóa tài liệu sinh viên theo ID" })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404 })
  async remove(
    @Param("id", ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    return this.studentDocumentService.remove(id);
  }
}
