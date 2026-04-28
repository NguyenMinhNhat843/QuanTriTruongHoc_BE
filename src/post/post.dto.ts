import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsDateString,
} from "class-validator";
import { PostStatus, PostType } from "../../prisma/generated/prisma/enums";

export class CreatePostDto {
  @ApiProperty({
    example: "Thông báo tuyển sinh năm học 2026",
    description: "Tiêu đề của bài viết",
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    example: "thong-bao-tuyen-sinh-2026",
    description:
      "Đường dẫn định danh (Slug), nếu để trống sẽ tự tạo theo title",
  })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({
    example: "https://example.com/images/cover.jpg",
    description: "URL ảnh bìa bài viết",
  })
  @IsString()
  @IsOptional()
  @IsUrl()
  coverImage?: string;

  @ApiProperty({
    example: "<h1>Nội dung bài viết...</h1>",
    description: "Nội dung bài viết (có thể chứa mã HTML)",
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    enum: PostType,
    default: PostType.NEWS,
    description: "Phân loại bài viết",
  })
  @IsEnum(PostType)
  @IsOptional()
  type?: PostType;

  @ApiProperty({
    enum: PostStatus,
    default: PostStatus.DRAFT,
    description: "Trạng thái bài viết",
  })
  @IsEnum(PostStatus)
  @IsOptional()
  status?: PostStatus;

  @ApiPropertyOptional({
    example: "2026-05-01T08:00:00Z",
    description: "Thời điểm hẹn giờ đăng bài (ISO 8601)",
  })
  @IsDateString()
  @IsOptional()
  publishedAt?: string;

  @ApiProperty({
    example: 1,
    description: "ID của người tạo bài viết",
  })
  @IsInt()
  @IsNotEmpty()
  authorId: number;
}

export class UpdatePostDto extends PartialType(CreatePostDto) {}
