import { Module } from "@nestjs/common";
import { PostService } from "./post.service";
import { PostController } from "./post.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { CloudinaryModule } from "../cloundinary/cloundinary.module";

@Module({
  imports: [PrismaModule, CloudinaryModule],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {}
