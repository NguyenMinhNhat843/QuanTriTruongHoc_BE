import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
  PickType,
} from "@nestjs/swagger";
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDate,
  IsNumber,
} from "class-validator";
import { PostStatus, PostType } from "../../prisma/generated/prisma/enums";
import { Post } from "../../prisma/generated/prisma/client";
import { Type } from "class-transformer";
import { ResponseUserWithRelationDto } from "../user/user.response";

export class PostDto implements Post {
  @ApiPropertyOptional({ type: Number })
  @IsNumber()
  @IsOptional()
  id: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  authorId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ type: String, format: "binary" })
  @IsOptional()
  coverImage: string | null;

  @ApiPropertyOptional({ type: Date })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  publishedAt: Date | null;

  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional()
  slug: string;

  @ApiProperty({ enum: PostStatus })
  @IsEnum(PostStatus)
  @IsNotEmpty()
  status: PostStatus;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ enum: PostType })
  @IsEnum(PostType)
  @IsNotEmpty()
  type: PostType;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  viewCount: number;

  @ApiPropertyOptional({ type: String })
  seoDescription: string | null;

  @ApiPropertyOptional({ type: String })
  seoTitle: string | null;

  @ApiPropertyOptional({ type: String })
  summary: string | null;

  @ApiProperty()
  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty()
  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  updatedAt: Date;
}

export class PostResponseDto extends PostDto {
  // quan hệ
  @ApiProperty({ type: () => ResponseUserWithRelationDto })
  author: ResponseUserWithRelationDto;
}

export class PostResponseDtoPagination {
  @ApiProperty({
    type: [PostResponseDto],
  })
  data: PostResponseDto[];

  @ApiProperty({
    type: Number,
  })
  total: number;
}

export class CreatePostDto extends OmitType(PostDto, [
  "id",
  "createdAt",
  "updatedAt",
  "viewCount",
  "coverImage",
] as const) {
  @ApiPropertyOptional({ type: "string", format: "binary" })
  coverImage?: any;
}

export class UpdatePostDto extends PartialType(CreatePostDto) {}

export class SearchPostDto extends PartialType(
  PickType(PostDto, ["type", "status", "createdAt", "title"]),
) {
  @ApiPropertyOptional({ type: Number })
  @IsNumber()
  @Type(() => Number)
  limit: number = 10;

  @ApiPropertyOptional({ type: Number })
  @IsNumber()
  @Type(() => Number)
  page: number = 1;
}

export class PostStatsResponseDto {
  @ApiProperty()
  totalPosts: number;

  @ApiProperty()
  draftPosts: number;

  @ApiProperty({ type: "object", additionalProperties: { type: "number" } })
  typeCounts: Record<string, number>;
}
