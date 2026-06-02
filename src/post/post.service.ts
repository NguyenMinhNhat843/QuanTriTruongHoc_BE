import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import slugify from "slugify";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreatePostDto,
  PostResponseDto,
  SearchPostDto,
  UpdatePostDto,
} from "./post.dto";
import { PostStatus } from "../../prisma/generated/prisma/enums";
import { Cron, CronExpression } from "@nestjs/schedule";
import { CloudinaryService } from "../cloundinary/cloundinary.service";
import { plainToInstance } from "class-transformer";

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Tạo bài viết mới
   */
  async create(createPostDto: CreatePostDto, file: Express.Multer.File) {
    const { title, slug, ...data } = createPostDto;

    // Nếu không có slug, tự động tạo từ title
    const finalSlug = slug
      ? slug
      : slugify(title, { lower: true, strict: true, locale: "vi" });

    // Kiểm tra trùng lặp slug
    const existingPost = await this.prisma.post.findUnique({
      where: { slug: finalSlug },
    });

    if (file) {
      const image = await this.cloudinaryService.uploadImage(
        file,
        "quantritruonghoc/posts",
      );
      data.coverImage = image.imageUrl;
    }

    if (existingPost) {
      throw new ConflictException("Slug hoặc tiêu đề này đã tồn tại");
    }

    const result = await this.prisma.post.create({
      data: {
        ...data,
        title,
        slug: finalSlug,
      },
      include: {
        author: true,
      },
    });

    return plainToInstance(PostResponseDto, result);
  }

  /**
   * Lấy chi tiết bài viết
   */
  async findOne(id: number) {
    const post = await this.prisma.post.findUnique({
      where: { id },
    });

    return post ? plainToInstance(PostResponseDto, post) : null;
  }

  /**
   * Thống kê đơn giản
   */
  async getStats() {
    const [totalPosts, rawStatusCounts, rawTypeCounts] = await Promise.all([
      this.prisma.post.count(),
      this.prisma.post.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      this.prisma.post.groupBy({
        by: ["type"],
        _count: { type: true },
      }),
    ]);

    const statusCounts = rawStatusCounts.reduce(
      (acc, curr) => {
        acc[curr.status] = curr._count.status;
        return acc;
      },
      {} as Record<string, number>,
    );

    const typeCounts = rawTypeCounts.reduce(
      (acc, curr) => {
        acc[curr.type] = curr._count.type;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalPosts,
      draftPosts: statusCounts["DRAFT"] || 0,
      typeCounts,
    };
  }

  /**
   * Lấy danh sách bài viết (Có phân trang và lọc)
   */
  async findAll(query: SearchPostDto) {
    const { page = 1, limit = 10, status } = query;
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [items, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: "desc" },
        include: {
          author: true,
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        total,
      },
    };
  }

  /**
   * Cập nhật bài viết
   */
  async update(
    id: number,
    updatePostDto: UpdatePostDto,
    file: Express.Multer.File,
  ) {
    console.log("Updating post with ID:", updatePostDto);
    // Kiểm tra bài viết tồn tại
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post)
      throw new NotFoundException(`Không tìm thấy bài viết có ID ${id}`);

    const data: any = { ...updatePostDto };

    // Nếu có update title mà không truyền slug, cập nhật lại slug mới
    if (updatePostDto.title && !updatePostDto.slug) {
      data.slug = slugify(updatePostDto.title, {
        lower: true,
        strict: true,
        locale: "vi",
      });
    }

    // Kiểm tra trùng slug (trừ chính nó)
    if (data.slug) {
      const existingSlug = await this.prisma.post.findFirst({
        where: {
          slug: data.slug,
          id: { not: id },
        },
      });
      if (existingSlug)
        throw new ConflictException("Slug đã tồn tại ở một bài viết khác");
    }

    if (file) {
      const image = await this.cloudinaryService.uploadImage(
        file,
        "quantritruonghoc/posts",
      );
      data.coverImage = image.imageUrl;
    }

    return this.prisma.post.update({
      where: { id },
      data,
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleScheduledPosts() {
    this.logger.debug("Đang kiểm tra các bài viết hẹn giờ...");

    const now = new Date();

    // Tìm và cập nhật các bài viết:
    // 1. Trạng thái khác PUBLISHED (thường là PENDING hoặc DRAFT)
    // 2. Thời gian publishedAt nhỏ hơn hoặc bằng hiện tại
    const result = await this.prisma.post.updateMany({
      where: {
        status: { not: PostStatus.PUBLISHED },
        publishedAt: {
          lte: now,
        },
      },
      data: {
        status: PostStatus.PUBLISHED,
      },
    });

    if (result.count > 0) {
      this.logger.log(`Đã tự động đăng ${result.count} bài viết.`);
    }
  }
}
