import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import slugify from "slugify";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePostDto, UpdatePostDto } from "./post.dto";
import { PostStatus } from "../../prisma/generated/prisma/enums";
import { Cron, CronExpression } from "@nestjs/schedule";

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);
  constructor(private prisma: PrismaService) {}

  /**
   * Tạo bài viết mới
   */
  async create(createPostDto: CreatePostDto) {
    const { title, slug, ...data } = createPostDto;

    // Nếu không có slug, tự động tạo từ title
    const finalSlug = slug
      ? slug
      : slugify(title, { lower: true, strict: true, locale: "vi" });

    // Kiểm tra trùng lặp slug
    const existingPost = await this.prisma.post.findUnique({
      where: { slug: finalSlug },
    });

    if (existingPost) {
      throw new ConflictException("Slug hoặc tiêu đề này đã tồn tại");
    }

    return this.prisma.post.create({
      data: {
        ...data,
        title,
        slug: finalSlug,
      },
      include: {
        author: true,
      },
    });
  }

  /**
   * Lấy danh sách bài viết (Có phân trang và lọc)
   */
  async findAll(query: { page?: number; limit?: number; status?: PostStatus }) {
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
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Cập nhật bài viết
   */
  async update(id: number, updatePostDto: UpdatePostDto) {
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

    return this.prisma.post.update({
      where: { id },
      data,
    });
  }

  // Chạy mỗi phút một lần (hoặc tùy chỉnh thời gian phù hợp)
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
