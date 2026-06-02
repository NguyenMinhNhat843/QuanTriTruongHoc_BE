import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
} from "@nestjs/swagger";
import { PostService } from "./post.service";
import {
  CreatePostDto,
  PostResponseDto,
  PostResponseDtoPagination,
  SearchPostDto,
  UpdatePostDto,
} from "./post.dto";
import { FileInterceptor } from "@nestjs/platform-express/multer/interceptors/file.interceptor";

@ApiTags("Post (Quản trị bài viết)") // Nhóm các API này lại trong Swagger
@Controller("posts")
export class PostController {
  constructor(private readonly postService: PostService) {}

  /**
   * Thống kê đơn giản
   */
  @Get("stats")
  @ApiOperation({ summary: "Lấy thống kê bài viết" })
  @ApiResponse({ status: 200, description: "Thống kê bài viết." })
  async getStats() {
    return this.postService.getStats();
  }

  @Post()
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("coverImage"))
  @ApiOperation({ summary: "Tạo bài viết mới" })
  @ApiResponse({ status: 201, type: PostResponseDto })
  create(
    @Body() createPostDto: CreatePostDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.postService.create(createPostDto, file);
  }

  @Get(":id")
  @ApiOperation({ summary: "Lấy thông tin bài viết theo ID" })
  @ApiResponse({ status: 200, type: PostResponseDto })
  @ApiResponse({ status: 404, description: "Không tìm thấy bài viết." })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.postService.findOne(id);
  }

  @Get()
  @ApiOperation({ summary: "Lấy danh sách bài viết" })
  @ApiResponse({ status: 200, type: PostResponseDtoPagination })
  findAll(@Query() query: SearchPostDto) {
    return this.postService.findAll(query);
  }

  @Patch(":id")
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Cập nhật bài viết theo ID" })
  @ApiResponse({ status: 200, description: "Cập nhật thành công." })
  @ApiResponse({ status: 404, description: "Không tìm thấy bài viết." })
  @UseInterceptors(FileInterceptor("coverImage"))
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updatePostDto: UpdatePostDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    console.log(
      "Received update for post ID:",
      id,
      "with data:",
      updatePostDto,
    );

    return this.postService.update(id, updatePostDto, file);
  }
}
