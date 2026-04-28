import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  ParseIntPipe,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { PostService } from "./post.service";
import { CreatePostDto, UpdatePostDto } from "./post.dto";
import { PostStatus } from "../../prisma/generated/prisma/enums";

@ApiTags("Post (Quản trị bài viết)") // Nhóm các API này lại trong Swagger
@Controller("posts")
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @ApiOperation({ summary: "Tạo bài viết mới" })
  @ApiResponse({ status: 201, description: "Bài viết đã được tạo thành công." })
  @ApiResponse({ status: 409, description: "Slug hoặc tiêu đề đã tồn tại." })
  create(@Body() createPostDto: CreatePostDto) {
    return this.postService.create(createPostDto);
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
