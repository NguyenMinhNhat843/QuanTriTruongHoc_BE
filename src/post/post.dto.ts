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
import { StaffResponseDto } from "../staff/staff.response";

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
  @ApiProperty({ type: () => StaffResponseDto })
  author: StaffResponseDto;
}

class PaginationMetaDto {
  @ApiProperty()
  total: number;
}

export class PostResponseDtoPagination {
  @ApiProperty({
    type: [PostResponseDto],
  })
  data: PostResponseDto[];

  @ApiProperty({
    type: PaginationMetaDto,
  })
  meta: PaginationMetaDto;
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
  limit: number = 10;

  @ApiPropertyOptional({ type: Number })
  @IsNumber()
  page: number = 1;
}
