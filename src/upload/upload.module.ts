import { Module } from "@nestjs/common";
import { CloudinaryService } from "./upload.service";
import { FileStoreController } from "./upload.controller";
import { CloudinaryProvider } from "./upload.provider";

@Module({
  providers: [CloudinaryService, CloudinaryProvider],
  controllers: [FileStoreController],
  exports: [CloudinaryService, CloudinaryProvider],
})
export class CloudinaryModule {}
