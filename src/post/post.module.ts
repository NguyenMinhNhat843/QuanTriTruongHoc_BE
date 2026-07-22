import { Module } from "@nestjs/common";
import { PostService } from "./post.service";
import { PostController } from "./post.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { UploadFileModule } from "../upload/upload.module";

@Module({
  imports: [PrismaModule, UploadFileModule],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {}
