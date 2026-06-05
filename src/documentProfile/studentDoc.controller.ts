import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseInterceptors,
  UploadedFiles,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
} from "@nestjs/swagger";
import {
  CreateStudentDocumentDto,
  UpdateStudentDocumentDto,
  StudentDocumentResponseDto,
  SearchStudentDocDto,
  CreateManyStudentDocumentDto,
} from "./studentDoc.dto";
import { StudentDocumentService } from "./studentDoc.service";
import { FilesInterceptor } from "@nestjs/platform-express";

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

  @Post("bulk")
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FilesInterceptor("files"))
  @ApiOperation({ summary: "Tạo nhiều tài liệu sinh viên cùng lúc" })
  @ApiResponse({ status: 201 })
  async createMany(
    @Body() dto: CreateManyStudentDocumentDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.studentDocumentService.createMany(dto, files);
  }

  @Get()
  @ApiOperation({ summary: "Lấy danh sách tất cả tài liệu sinh viên" })
  @ApiResponse({ status: 200, type: [StudentDocumentResponseDto] })
  async findAll(
    @Query() query: SearchStudentDocDto,
  ): Promise<StudentDocumentResponseDto[]> {
    return this.studentDocumentService.findAll(query);
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
