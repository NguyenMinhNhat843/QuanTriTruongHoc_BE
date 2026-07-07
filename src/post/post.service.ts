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
  PostStatsResponseDto,
  SearchPostDto,
  UpdatePostDto,
} from "./post.dto";
import { PostStatus } from "../../prisma/generated/prisma/enums";
import { Cron, CronExpression } from "@nestjs/schedule";
import { CloudinaryService } from "../upload/upload.service";
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

    if (existingPost) {
      throw new ConflictException("Slug hoặc tiêu đề này đã tồn tại");
    }

    if (file) {
      const image = await this.cloudinaryService.uploadImageAndSaveDb(
        file,
        "quantritruonghoc/posts",
      );
      data.coverImage = image.imageUrl;
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
      include: {
        author: {
          include: {
            staff: true,
          },
        },
      },
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

    return plainToInstance(PostStatsResponseDto, {
      totalPosts,
      draftPosts: statusCounts["DRAFT"] || 0,
      typeCounts,
    });
  }

  /**
   * Lấy danh sách bài viết (Có phân trang và lọc)
   */
  async findAll(query: SearchPostDto) {
    const { page = 1, limit = 10, status, type, title } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (title) where.title = { contains: title, mode: "insensitive" };

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
      total,
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

    let fileStoreId: string | null = null;
    if (file) {
      const image = await this.cloudinaryService.uploadImageAndSaveDb(
        file,
        "quantritruonghoc/posts",
      );
      data.coverImage = image.imageUrl;
      fileStoreId = image.id;
    }

    // update bài viết
    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.post.update({
        where: { id },
        data,
        include: { author: true },
      });

      if (fileStoreId) {
        // Bật trạng thái ảnh mới thành true
        await tx.fileStore.update({
          where: { id: fileStoreId },
          data: { isUsed: true, postId: updated.id },
        });

        // Tìm ảnh cũ của bài viết (nếu có) chuyển về false để cronjob dọn dẹp sau
        if (post.coverImage) {
          await tx.fileStore.updateMany({
            where: {
              imageUrl: post.coverImage,
              id: { not: fileStoreId },
            },
            data: { isUsed: false, postId: null },
          });
        }
      }

      return updated;
    });

    return {
      message: "Cập nhật bài viết thành công",
    };
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
