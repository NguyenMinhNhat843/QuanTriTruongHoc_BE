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
  ApiQuery,
  ApiConsumes,
} from "@nestjs/swagger";
import { PostService } from "./post.service";
import { CreatePostDto, PostResponseDto, UpdatePostDto } from "./post.dto";
import { PostStatus } from "../../prisma/generated/prisma/enums";
import { FileInterceptor } from "@nestjs/platform-express/multer/interceptors/file.interceptor";

@ApiTags("Post (Quản trị bài viết)") // Nhóm các API này lại trong Swagger
@Controller("posts")
export class PostController {
  constructor(private readonly postService: PostService) {}

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

  @Get()
  @ApiOperation({ summary: "Lấy danh sách bài viết" })
  @ApiQuery({ name: "page", required: false, example: 1 })
  @ApiQuery({ name: "limit", required: false, example: 10 })
  @ApiQuery({ name: "status", enum: PostStatus, required: false })
  findAll(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: PostStatus,
  ) {
    return this.postService.findAll({
      page: page ? +page : 1,
      limit: limit ? +limit : 10,
      status,
    });
  }

  @Patch(":id")
  @ApiOperation({ summary: "Cập nhật bài viết theo ID" })
  @ApiResponse({ status: 200, description: "Cập nhật thành công." })
  @ApiResponse({ status: 404, description: "Không tìm thấy bài viết." })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postService.update(id, updatePostDto);
  }
}
